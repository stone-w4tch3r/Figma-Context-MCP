import { mkdtemp, readdir, rm } from "fs/promises";
import os from "os";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import type { GetFileNodesResponse, GetFileResponse } from "@figma/rest-api-spec";
import { FigmaService, type FigmaAuthOptions } from "./figma.js";

const AUTH_OPTIONS: FigmaAuthOptions = {
  figmaApiKey: "test-key",
  figmaOAuthToken: "",
  useOAuth: false,
};

function createSampleFile(): GetFileResponse {
  return {
    name: "Sample",
    lastModified: new Date().toISOString(),
    thumbnailUrl: "",
    version: "1",
    role: "viewer",
    editorType: "figma",
    schemaVersion: 0,
    components: {},
    componentSets: {},
    styles: {},
    document: {
      id: "0:0",
      name: "Document",
      type: "DOCUMENT",
      children: [
        {
          id: "10:20",
          name: "Page",
          type: "CANVAS",
          children: [
            {
              id: "11:22",
              name: "Frame",
              type: "FRAME",
              children: [],
            },
          ],
        },
      ],
    },
  } as unknown as GetFileResponse;
}

function createRootAResponse(): GetFileNodesResponse {
  return createNodeResponse({
    rootId: "10:20",
    children: [
      {
        id: "10:21",
        children: [{ id: "10:22", children: [] }],
      },
    ],
  });
}

function createRootBResponse(): GetFileNodesResponse {
  return createNodeResponse({
    rootId: "10:40",
    children: [{ id: "10:41", children: [] }],
  });
}

function createOverlappingRootBResponse(): GetFileNodesResponse {
  return createNodeResponse({
    rootId: "10:40",
    children: [{ id: "10:21", children: [] }],
  });
}

function createUnrelatedNodeResponse(nodeId = "99:1"): GetFileNodesResponse {
  return createNodeResponse({ rootId: nodeId, children: [] });
}

async function createCacheDir(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "figma-service-cache-test-"));
}

async function cleanup(dir: string): Promise<void> {
  await rm(dir, { recursive: true, force: true });
}

describe("FigmaService caching", () => {
  it("reuses cached files for repeated getRawFile calls", async () => {
    const cacheDir = await createCacheDir();
    const sample = createSampleFile();
    const requestSpy = spyOnRequest().mockResolvedValue(sample);

    try {
      const service = new FigmaService(AUTH_OPTIONS, { cacheDir, ttlMs: 60_000 });
      const first = await service.getRawFile("FILE123");
      const second = await service.getRawFile("FILE123");

      expect(first.data.name).toBe("Sample");
      expect(second.data.document.id).toBe("0:0");
      expect(requestSpy).toHaveBeenCalledTimes(1);
    } finally {
      requestSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("serves node lookups from cached file without extra API calls in default mode", async () => {
    const cacheDir = await createCacheDir();
    const sample = createSampleFile();
    const requestSpy = spyOnRequest().mockResolvedValue(sample);

    try {
      const service = new FigmaService(AUTH_OPTIONS, { cacheDir, ttlMs: 60_000 });
      const nodeId = "10:20";

      const first = await service.getRawNode("FILE456", nodeId);
      expect(first.data.nodes[nodeId]).toBeDefined();
      expect(requestSpy).toHaveBeenCalledTimes(1);

      await service.getRawNode("FILE456", nodeId);
      expect(requestSpy).toHaveBeenCalledTimes(1);
    } finally {
      requestSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("first descendant request seeds all configured roots for the file", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = spyOnRequestWithSize().mockImplementation(async (endpoint) => {
      if (endpoint.includes("ids=10:20")) {
        return { data: createRootAResponse(), rawSize: 100 };
      }

      if (endpoint.includes("ids=10:40")) {
        return { data: createRootBResponse(), rawSize: 100 };
      }

      throw new Error(`unexpected endpoint: ${endpoint}`);
    });
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      const response = await service.getRawNode("FILE789", "10:21");

      expect(response.data.nodes["10:21"]?.document.id).toBe("10:21");
      expect(requestSpy).toHaveBeenCalledTimes(2);
      expect(requestSpy).toHaveBeenCalledWith("/files/FILE789/nodes?ids=10:20");
      expect(requestSpy).toHaveBeenCalledWith("/files/FILE789/nodes?ids=10:40");
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("second descendant request under the same root uses cache without another API call", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = spyOnRequestWithSize().mockImplementation(async (endpoint) => {
      if (endpoint.includes("ids=10:20")) {
        return { data: createRootAResponse(), rawSize: 100 };
      }

      if (endpoint.includes("ids=10:40")) {
        return { data: createRootBResponse(), rawSize: 100 };
      }

      throw new Error(`unexpected endpoint: ${endpoint}`);
    });
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      await service.getRawNode("FILE789", "10:21");
      const second = await service.getRawNode("FILE789", "10:22");

      expect(second.data.nodes["10:22"]?.document.id).toBe("10:22");
      expect(second.cacheInfo?.usedCache).toBe(true);
      expect(requestSpy).toHaveBeenCalledTimes(2);
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("later request for the configured root itself is an exact subtree-cache hit", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = createSubtreeRequestSpy();
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      await service.getRawNode("FILE789", "10:21");
      const cachedRoot = await service.getRawNode("FILE789", "10:20");

      expect(cachedRoot.data.nodes["10:20"]?.document.id).toBe("10:20");
      expect(cachedRoot.cacheInfo?.usedCache).toBe(true);
      expect(requestSpy).toHaveBeenCalledTimes(2);
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("later request for a grandchild is served from cache and preserves the document payload", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = createSubtreeRequestSpy();
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      await service.getRawNode("FILE789", "10:21");
      const cachedGrandchild = await service.getRawNode("FILE789", "10:21", 1);
      const cachedDocument = cachedGrandchild.data.nodes["10:21"]?.document as
        | MockFigmaNode
        | undefined;

      expect(cachedGrandchild.data.nodes["10:21"]?.document.id).toBe("10:21");
      expect(cachedDocument?.children[0]?.id).toBe("10:22");
      expect(cachedGrandchild.cacheInfo?.usedCache).toBe(true);
      expect(requestSpy).toHaveBeenCalledTimes(2);
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("second configured root is also available after the first seed", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = createSubtreeRequestSpy();
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      await service.getRawNode("FILE789", "10:21");
      const secondRoot = await service.getRawNode("FILE789", "10:40");

      expect(secondRoot.data.nodes["10:40"]?.document.id).toBe("10:40");
      expect(secondRoot.cacheInfo?.usedCache).toBe(true);
      expect(requestSpy).toHaveBeenCalledTimes(2);
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("request for unrelated node still calls Figma", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = spyOnRequestWithSize().mockImplementation(async (endpoint) => {
      if (endpoint.includes("ids=10:20")) {
        return { data: createRootAResponse(), rawSize: 100 };
      }

      if (endpoint.includes("ids=10:40")) {
        return { data: createRootBResponse(), rawSize: 100 };
      }

      if (endpoint.includes("ids=99:1")) {
        return { data: createUnrelatedNodeResponse(), rawSize: 100 };
      }

      throw new Error(`unexpected endpoint: ${endpoint}`);
    });
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      await service.getRawNode("FILE789", "10:21");
      const response = await service.getRawNode("FILE789", "99:1");

      expect(response.data.nodes["99:1"]?.document.id).toBe("99:1");
      expect(requestSpy).toHaveBeenCalledTimes(3);
      expect(requestSpy).toHaveBeenLastCalledWith("/files/FILE789/nodes?ids=99:1");
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("repeated unrelated-node requests keep calling Figma in subtree mode", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = createSubtreeRequestSpy();
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      await service.getRawNode("FILE789", "10:21");
      await service.getRawNode("FILE789", "99:1");
      await service.getRawNode("FILE789", "99:1");

      expect(requestSpy).toHaveBeenCalledTimes(4);
      expect(requestSpy).toHaveBeenNthCalledWith(3, "/files/FILE789/nodes?ids=99:1");
      expect(requestSpy).toHaveBeenNthCalledWith(4, "/files/FILE789/nodes?ids=99:1");
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("TTL expiry causes reseed", async () => {
    const cacheDir = await createCacheDir();
    const dateSpy = vi.spyOn(Date, "now");
    const requestSpy = createSubtreeRequestSpy();
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 10,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      dateSpy.mockReturnValue(1000);
      await service.getRawNode("FILE789", "10:21");

      dateSpy.mockReturnValue(1011);
      await service.getRawNode("FILE789", "10:21");

      expect(requestSpy).toHaveBeenCalledTimes(4);
    } finally {
      dateSpy.mockRestore();
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("missing manifest causes reseed", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = createSubtreeRequestSpy();
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      await service.getRawNode("FILE789", "10:21");
      await rm(path.join(cacheDir, "FILE789__subtree-manifest.json"), { force: true });
      await service.getRawNode("FILE789", "10:21");

      expect(requestSpy).toHaveBeenCalledTimes(4);
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("missing index causes reseed", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = createSubtreeRequestSpy();
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      await service.getRawNode("FILE789", "10:21");
      await rm(path.join(cacheDir, "FILE789__subtree-index.json"), { force: true });
      await service.getRawNode("FILE789", "10:21");

      expect(requestSpy).toHaveBeenCalledTimes(4);
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("missing subtree payload causes reseed", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = createSubtreeRequestSpy();
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      await service.getRawNode("FILE789", "10:21");
      await rm(path.join(cacheDir, "FILE789__subtree__10-20.json"), { force: true });
      await service.getRawNode("FILE789", "10:21");

      expect(requestSpy).toHaveBeenCalledTimes(4);
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("concurrent first requests for the same file share one seed operation", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = createSubtreeRequestSpy();
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      const [first, second] = await Promise.all([
        service.getRawNode("FILE789", "10:21"),
        service.getRawNode("FILE789", "10:22"),
      ]);

      expect(first.data.nodes["10:21"]?.document.id).toBe("10:21");
      expect(second.data.nodes["10:22"]?.document.id).toBe("10:22");
      expect(requestSpy).toHaveBeenCalledTimes(2);
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("fails subtree seeding when configured roots overlap", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = spyOnRequestWithSize().mockImplementation(async (endpoint) => {
      if (endpoint.includes("ids=10:20")) {
        return { data: createRootAResponse(), rawSize: 100 };
      }

      if (endpoint.includes("ids=10:40")) {
        return { data: createOverlappingRootBResponse(), rawSize: 100 };
      }

      throw new Error(`unexpected endpoint: ${endpoint}`);
    });
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      await expect(service.getRawNode("FILE789", "10:21")).rejects.toThrow(
        /overlapping subtree roots/i,
      );
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });

  it("failed seed for one configured root rolls back subtree state and fails the request", async () => {
    const cacheDir = await createCacheDir();
    const requestSpy = spyOnRequestWithSize().mockImplementation(async (endpoint) => {
      if (endpoint.includes("ids=10:20")) {
        return { data: createRootAResponse(), rawSize: 100 };
      }

      if (endpoint.includes("ids=10:40")) {
        throw new Error("seed failed for 10:40");
      }

      throw new Error(`unexpected endpoint: ${endpoint}`);
    });
    const fullFileSpy = spyOnRequest().mockImplementation(async (endpoint) => {
      throw new Error(`unexpected file endpoint: ${endpoint}`);
    });

    try {
      const service = new FigmaService(AUTH_OPTIONS, {
        cacheDir,
        ttlMs: 60_000,
        cacheType: "subtree",
        subtreeRootsByFile: { FILE789: ["10:20", "10:40"] },
      });

      await expect(service.getRawNode("FILE789", "10:21")).rejects.toThrow(/subtree|seed failed/i);

      const entries = await readdir(cacheDir);
      expect(entries.filter((entry) => entry.startsWith("FILE789__subtree"))).toEqual([]);
    } finally {
      requestSpy.mockRestore();
      fullFileSpy.mockRestore();
      await cleanup(cacheDir);
    }
  });
});

function createNodeResponse(tree: TreeNode): GetFileNodesResponse {
  return {
    name: "Sample",
    lastModified: new Date().toISOString(),
    thumbnailUrl: "",
    version: "1",
    role: "viewer",
    editorType: "figma",
    nodes: {
      [tree.rootId]: {
        document: createFigmaNode(tree.rootId, tree.children),
        components: {},
        componentSets: {},
        styles: {},
        schemaVersion: 0,
      },
    },
  } as unknown as GetFileNodesResponse;
}

function createFigmaNode(id: string, children: TreeChild[]): MockFigmaNode {
  return {
    id,
    name: `Node ${id}`,
    type: "FRAME",
    children: children.map((child) => createFigmaNode(child.id, child.children)),
  };
}

type TreeNode = {
  rootId: string;
  children: TreeChild[];
};

type TreeChild = {
  id: string;
  children: TreeChild[];
};

type MockFigmaNode = {
  id: string;
  name: string;
  type: "FRAME";
  children: MockFigmaNode[];
};

function spyOnRequest() {
  return vi.spyOn(
    FigmaService.prototype as unknown as {
      request: (endpoint: string) => Promise<unknown>;
    },
    "request",
  );
}

function spyOnRequestWithSize() {
  return vi.spyOn(
    FigmaService.prototype as unknown as {
      requestWithSize: (endpoint: string) => Promise<unknown>;
    },
    "requestWithSize",
  );
}

function createSubtreeRequestSpy() {
  return spyOnRequestWithSize().mockImplementation(async (endpoint) => {
    if (endpoint.includes("ids=10:20")) {
      return { data: createRootAResponse(), rawSize: 100 };
    }

    if (endpoint.includes("ids=10:40")) {
      return { data: createRootBResponse(), rawSize: 100 };
    }

    if (endpoint.includes("ids=99:1")) {
      return { data: createUnrelatedNodeResponse(), rawSize: 100 };
    }

    throw new Error(`unexpected endpoint: ${endpoint}`);
  });
}
