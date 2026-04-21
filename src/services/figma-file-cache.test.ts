import { mkdtemp, readdir, rm, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import type { GetFileNodesResponse, GetFileResponse } from "@figma/rest-api-spec";
import { FigmaFileCache } from "./figma-file-cache.js";

const SAMPLE_FILE: GetFileResponse = {
  name: "Test File",
  lastModified: new Date().toISOString(),
  thumbnailUrl: "",
  version: "1",
  role: "viewer",
  editorType: "figma",
  document: {
    id: "0:0",
    name: "Document",
    type: "DOCUMENT",
    children: [],
  },
  schemaVersion: 0,
  components: {},
  componentSets: {},
  styles: {},
} as unknown as GetFileResponse;

async function createTempDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "figma-file-cache-test-"));
}

async function cleanupDir(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

describe("FigmaFileCache", () => {
  it("stores and retrieves cached file entries", async () => {
    const dir = await createTempDir();
    try {
      const cache = new FigmaFileCache({ cacheDir: dir, ttlMs: 60_000 });

      await cache.setFile("ABC", SAMPLE_FILE);
      const loaded = await cache.getFile("ABC");

      expect(loaded?.data.name).toBe("Test File");
    } finally {
      await cleanupDir(dir);
    }
  });

  it("allows concurrent writes for the same file key", async () => {
    const dir = await createTempDir();
    try {
      const cache = new FigmaFileCache({ cacheDir: dir, ttlMs: 60_000 });

      await expect(
        Promise.all([
          cache.setFile("ABC", SAMPLE_FILE),
          cache.setFile("ABC", SAMPLE_FILE),
          cache.setFile("ABC", SAMPLE_FILE),
        ]),
      ).resolves.toEqual([undefined, undefined, undefined]);

      const loaded = await cache.getFile("ABC");
      expect(loaded?.data.name).toBe("Test File");
    } finally {
      await cleanupDir(dir);
    }
  });

  it("persists subtree entry metadata", async () => {
    const dir = await createTempDir();
    try {
      const cache = new FigmaFileCache({ cacheDir: dir, ttlMs: 60_000, cacheType: "subtree" });
      const subtree = createSubtreeResponse("10:20", ["10:21"]);

      await cache.setSubtree("FILE123", "10:20", subtree);
      const loaded = await cache.getSubtree("FILE123", "10:20");

      expect(loaded?.data.nodes["10:20"]?.document.id).toBe("10:20");
      expect(loaded?.rootNodeId).toBe("10:20");
      expect(loaded?.kind).toBe("subtree");
      expect(loaded?.fileKey).toBe("FILE123");
    } finally {
      await cleanupDir(dir);
    }
  });

  it("persists and reloads a per-file manifest", async () => {
    const dir = await createTempDir();
    try {
      const cache = new FigmaFileCache({ cacheDir: dir, ttlMs: 60_000, cacheType: "subtree" });

      await cache.setSubtreeManifest("FILE123", {
        fileKey: "FILE123",
        rootNodeIds: ["10:20", "10:40"],
        configSignature: "10:20,10:40",
        seededAt: 123,
      });

      const reloaded = new FigmaFileCache({ cacheDir: dir, ttlMs: 60_000, cacheType: "subtree" });

      expect(await reloaded.getSubtreeManifest("FILE123")).toEqual({
        fileKey: "FILE123",
        rootNodeIds: ["10:20", "10:40"],
        configSignature: "10:20,10:40",
        seededAt: 123,
      });
    } finally {
      await cleanupDir(dir);
    }
  });

  it("persists and reloads a per-file node-to-root index", async () => {
    const dir = await createTempDir();
    try {
      const cache = new FigmaFileCache({ cacheDir: dir, ttlMs: 60_000, cacheType: "subtree" });

      await cache.setSubtreeIndex("FILE123", {
        fileKey: "FILE123",
        configSignature: "10:20,10:40",
        nodeToRoot: {
          "10:20": "10:20",
          "10:21": "10:20",
          "10:40": "10:40",
        },
      });

      const reloaded = new FigmaFileCache({ cacheDir: dir, ttlMs: 60_000, cacheType: "subtree" });

      expect(await reloaded.getSubtreeIndex("FILE123")).toEqual({
        fileKey: "FILE123",
        configSignature: "10:20,10:40",
        nodeToRoot: {
          "10:20": "10:20",
          "10:21": "10:20",
          "10:40": "10:40",
        },
      });
    } finally {
      await cleanupDir(dir);
    }
  });

  it("replaces manifest and index on reseed", async () => {
    const dir = await createTempDir();
    try {
      const cache = new FigmaFileCache({ cacheDir: dir, ttlMs: 60_000, cacheType: "subtree" });

      await cache.setSubtreeManifest("FILE123", {
        fileKey: "FILE123",
        rootNodeIds: ["10:20"],
        configSignature: "10:20",
        seededAt: 100,
      });
      await cache.setSubtreeIndex("FILE123", {
        fileKey: "FILE123",
        configSignature: "10:20",
        nodeToRoot: { "10:20": "10:20" },
      });

      await cache.setSubtreeManifest("FILE123", {
        fileKey: "FILE123",
        rootNodeIds: ["10:40"],
        configSignature: "10:40",
        seededAt: 200,
      });
      await cache.setSubtreeIndex("FILE123", {
        fileKey: "FILE123",
        configSignature: "10:40",
        nodeToRoot: { "10:40": "10:40" },
      });

      expect(await cache.getSubtreeManifest("FILE123")).toEqual({
        fileKey: "FILE123",
        rootNodeIds: ["10:40"],
        configSignature: "10:40",
        seededAt: 200,
      });
      expect(await cache.getSubtreeIndex("FILE123")).toEqual({
        fileKey: "FILE123",
        configSignature: "10:40",
        nodeToRoot: { "10:40": "10:40" },
      });
    } finally {
      await cleanupDir(dir);
    }
  });

  it("isolates manifest and index by fileKey", async () => {
    const dir = await createTempDir();
    try {
      const cache = new FigmaFileCache({ cacheDir: dir, ttlMs: 60_000, cacheType: "subtree" });

      await cache.setSubtreeManifest("FILE123", {
        fileKey: "FILE123",
        rootNodeIds: ["10:20"],
        configSignature: "10:20",
        seededAt: 100,
      });
      await cache.setSubtreeManifest("FILE999", {
        fileKey: "FILE999",
        rootNodeIds: ["10:40"],
        configSignature: "10:40",
        seededAt: 200,
      });
      await cache.setSubtreeIndex("FILE123", {
        fileKey: "FILE123",
        configSignature: "10:20",
        nodeToRoot: { "10:20": "10:20" },
      });
      await cache.setSubtreeIndex("FILE999", {
        fileKey: "FILE999",
        configSignature: "10:40",
        nodeToRoot: { "10:40": "10:40" },
      });

      expect(await cache.getSubtreeManifest("FILE123")).toMatchObject({ fileKey: "FILE123" });
      expect(await cache.getSubtreeManifest("FILE999")).toMatchObject({ fileKey: "FILE999" });
      expect(await cache.getSubtreeIndex("FILE123")).toMatchObject({ fileKey: "FILE123" });
      expect(await cache.getSubtreeIndex("FILE999")).toMatchObject({ fileKey: "FILE999" });
    } finally {
      await cleanupDir(dir);
    }
  });

  it("treats expired subtree payloads as missing", async () => {
    const dir = await createTempDir();
    const dateSpy = vi.spyOn(Date, "now");
    try {
      const cache = new FigmaFileCache({ cacheDir: dir, ttlMs: 10, cacheType: "subtree" });
      dateSpy.mockReturnValue(1000);
      await cache.setSubtree("FILE123", "10:20", createSubtreeResponse("10:20", ["10:21"]));

      dateSpy.mockReturnValue(1011);
      expect(await cache.getSubtree("FILE123", "10:20")).toBeNull();
    } finally {
      dateSpy.mockRestore();
      await cleanupDir(dir);
    }
  });

  it("treats corrupted manifest and index files as invalid subtree state", async () => {
    const dir = await createTempDir();
    try {
      const cache = new FigmaFileCache({ cacheDir: dir, ttlMs: 60_000, cacheType: "subtree" });
      await cache.setSubtreeManifest("FILE123", {
        fileKey: "FILE123",
        rootNodeIds: ["10:20"],
        configSignature: "10:20",
        seededAt: 100,
      });
      await cache.setSubtreeIndex("FILE123", {
        fileKey: "FILE123",
        configSignature: "10:20",
        nodeToRoot: { "10:20": "10:20" },
      });

      await writeFile(await findCacheFile(dir, "FILE123", "manifest"), "not-json");
      await writeFile(await findCacheFile(dir, "FILE123", "index"), "not-json");

      expect(await cache.getSubtreeManifest("FILE123")).toBeNull();
      expect(await cache.getSubtreeIndex("FILE123")).toBeNull();
    } finally {
      await cleanupDir(dir);
    }
  });

  it("removes manifest, index, and subtree payloads together during invalidation", async () => {
    const dir = await createTempDir();
    try {
      const cache = new FigmaFileCache({ cacheDir: dir, ttlMs: 60_000, cacheType: "subtree" });
      await cache.setSubtree("FILE123", "10:20", createSubtreeResponse("10:20", ["10:21"]));
      await cache.setSubtree("FILE123", "10:40", createSubtreeResponse("10:40", []));
      await cache.setSubtreeManifest("FILE123", {
        fileKey: "FILE123",
        rootNodeIds: ["10:20", "10:40"],
        configSignature: "10:20,10:40",
        seededAt: 100,
      });
      await cache.setSubtreeIndex("FILE123", {
        fileKey: "FILE123",
        configSignature: "10:20,10:40",
        nodeToRoot: {
          "10:20": "10:20",
          "10:21": "10:20",
          "10:40": "10:40",
        },
      });

      await cache.clearSubtreeState("FILE123");

      expect(await cache.getSubtree("FILE123", "10:20")).toBeNull();
      expect(await cache.getSubtree("FILE123", "10:40")).toBeNull();
      expect(await cache.getSubtreeManifest("FILE123")).toBeNull();
      expect(await cache.getSubtreeIndex("FILE123")).toBeNull();
    } finally {
      await cleanupDir(dir);
    }
  });
});

function createSubtreeResponse(rootNodeId: string, childNodeIds: string[]): GetFileNodesResponse {
  return {
    name: "Test File",
    lastModified: new Date().toISOString(),
    thumbnailUrl: "",
    version: "1",
    role: "viewer",
    editorType: "figma",
    nodes: {
      [rootNodeId]: {
        document: {
          id: rootNodeId,
          name: `Node ${rootNodeId}`,
          type: "FRAME",
          children: childNodeIds.map((childNodeId) => ({
            id: childNodeId,
            name: `Node ${childNodeId}`,
            type: "FRAME",
            children: [],
          })),
        },
        components: {},
        componentSets: {},
        styles: {},
        schemaVersion: 0,
      },
    },
  } as unknown as GetFileNodesResponse;
}

async function findCacheFile(dir: string, fileKey: string, fragment: string): Promise<string> {
  const entries = await readdir(dir);
  const match = entries.find((entry) => entry.includes(fileKey) && entry.includes(fragment));
  if (!match) {
    throw new Error(`Cache file not found for ${fileKey} (${fragment})`);
  }

  return path.join(dir, match);
}
