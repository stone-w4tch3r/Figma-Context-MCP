import {
  access,
  constants,
  mkdir,
  readdir,
  readFile,
  rename,
  unlink,
  writeFile,
} from "fs/promises";
import path from "path";
import type { GetFileNodesResponse, GetFileResponse } from "@figma/rest-api-spec";
import { Logger } from "~/utils/logger.js";

export type FigmaCacheType = "default" | "subtree";

export type FigmaCachingOptions = {
  cacheDir: string;
  ttlMs: number;
  cacheType?: FigmaCacheType;
  subtreeRootsByFile?: Record<string, string[]>;
};

export type StoredCacheEntry = {
  fetchedAt: number;
  kind: "file" | "subtree";
  fileKey: string;
  rootNodeId?: string;
  data: GetFileResponse | GetFileNodesResponse;
};

export type StoredSubtreeManifest = {
  fileKey: string;
  rootNodeIds: string[];
  configSignature: string;
  seededAt: number;
};

export type StoredSubtreeIndex = {
  fileKey: string;
  configSignature: string;
  nodeToRoot: Record<string, string>;
};

export function buildSubtreeConfigSignature(rootNodeIds: string[]): string {
  return rootNodeIds.slice().sort().join(",");
}

type CacheReadResult<T> = {
  data: T;
  cachedAt: number;
  ttlMs: number;
  kind: StoredCacheEntry["kind"];
  fileKey: string;
  rootNodeId?: string;
};

export class FigmaFileCache {
  private initPromise: Promise<void>;

  get cacheType(): FigmaCacheType {
    return this.options.cacheType ?? "default";
  }

  constructor(private readonly options: FigmaCachingOptions) {
    this.initPromise = this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      await mkdir(this.options.cacheDir, { recursive: true });
      await access(this.options.cacheDir, constants.W_OK);
      Logger.log(`[FigmaFileCache] Initialized cache directory: ${this.options.cacheDir}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to initialize Figma cache: Cannot write to directory "${this.options.cacheDir}". ${message}`,
      );
    }
  }

  async waitForInit(): Promise<void> {
    await this.initPromise;
  }

  async get(
    fileKey: string,
    nodeId?: string,
  ): Promise<CacheReadResult<GetFileResponse | GetFileNodesResponse> | null> {
    return nodeId ? this.readEntry(this.getLegacyNodePath(fileKey, nodeId)) : this.getFile(fileKey);
  }

  async set(
    fileKey: string,
    data: GetFileResponse | GetFileNodesResponse,
    nodeId?: string,
  ): Promise<void> {
    if (nodeId) {
      await this.writeEntry(this.getLegacyNodePath(fileKey, nodeId), {
        fetchedAt: Date.now(),
        kind: "subtree",
        fileKey,
        rootNodeId: nodeId,
        data,
      });
      return;
    }

    await this.setFile(fileKey, data as GetFileResponse);
  }

  async getFile(fileKey: string): Promise<CacheReadResult<GetFileResponse> | null> {
    const cached = await this.readEntry(this.getFilePath(fileKey));
    if (!cached) {
      return null;
    }

    return { ...cached, data: cached.data as GetFileResponse };
  }

  async setFile(fileKey: string, data: GetFileResponse): Promise<void> {
    await this.writeEntry(this.getFilePath(fileKey), {
      fetchedAt: Date.now(),
      kind: "file",
      fileKey,
      data,
    });
    Logger.log(`[FigmaFileCache] Cached file ${fileKey}`);
  }

  async getSubtree(
    fileKey: string,
    rootNodeId: string,
  ): Promise<
    | (CacheReadResult<GetFileNodesResponse> & {
        kind: "subtree";
        fileKey: string;
        rootNodeId: string;
      })
    | null
  > {
    const cached = await this.readEntry(this.getSubtreePath(fileKey, rootNodeId));
    if (!cached) {
      return null;
    }

    if (cached.kind !== "subtree" || cached.rootNodeId !== rootNodeId) {
      await this.safeDelete(this.getSubtreePath(fileKey, rootNodeId));
      return null;
    }

    return {
      ...cached,
      data: cached.data as GetFileNodesResponse,
      kind: "subtree",
      fileKey,
      rootNodeId,
    };
  }

  async setSubtree(fileKey: string, rootNodeId: string, data: GetFileNodesResponse): Promise<void> {
    await this.writeEntry(this.getSubtreePath(fileKey, rootNodeId), {
      fetchedAt: Date.now(),
      kind: "subtree",
      fileKey,
      rootNodeId,
      data,
    });
    Logger.log(`[FigmaFileCache] Cached subtree ${fileKey}:${rootNodeId}`);
  }

  async getSubtreeManifest(fileKey: string): Promise<StoredSubtreeManifest | null> {
    const manifestPath = this.getSubtreeManifestPath(fileKey);
    return this.readJsonFile(manifestPath, (value): value is StoredSubtreeManifest => {
      return (
        isRecord(value) &&
        value.fileKey === fileKey &&
        Array.isArray(value.rootNodeIds) &&
        value.rootNodeIds.every((rootNodeId) => typeof rootNodeId === "string") &&
        typeof value.configSignature === "string" &&
        typeof value.seededAt === "number"
      );
    });
  }

  async setSubtreeManifest(fileKey: string, manifest: StoredSubtreeManifest): Promise<void> {
    await this.writeJsonFile(this.getSubtreeManifestPath(fileKey), manifest);
  }

  async getSubtreeIndex(fileKey: string): Promise<StoredSubtreeIndex | null> {
    const indexPath = this.getSubtreeIndexPath(fileKey);
    return this.readJsonFile(indexPath, (value): value is StoredSubtreeIndex => {
      return (
        isRecord(value) &&
        value.fileKey === fileKey &&
        typeof value.configSignature === "string" &&
        isRecord(value.nodeToRoot) &&
        Object.values(value.nodeToRoot).every((rootNodeId) => typeof rootNodeId === "string")
      );
    });
  }

  async setSubtreeIndex(fileKey: string, index: StoredSubtreeIndex): Promise<void> {
    await this.writeJsonFile(this.getSubtreeIndexPath(fileKey), index);
  }

  async clearSubtreeState(fileKey: string): Promise<void> {
    await this.waitForInit();

    const prefix = this.getSubtreePrefix(fileKey);
    const entries = await readdir(this.options.cacheDir);
    await Promise.all(
      entries
        .filter(
          (entry) =>
            entry.startsWith(prefix) ||
            entry === path.basename(this.getSubtreeManifestPath(fileKey)) ||
            entry === path.basename(this.getSubtreeIndexPath(fileKey)),
        )
        .map((entry) => this.safeDelete(path.join(this.options.cacheDir, entry))),
    );
  }

  private getFilePath(fileKey: string): string {
    return path.join(this.options.cacheDir, `${sanitizeCacheKey(fileKey)}.json`);
  }

  private getLegacyNodePath(fileKey: string, nodeId: string): string {
    return path.join(
      this.options.cacheDir,
      `${sanitizeCacheKey(fileKey)}-${sanitizeCacheKey(nodeId)}.json`,
    );
  }

  private getSubtreePrefix(fileKey: string): string {
    return `${sanitizeCacheKey(fileKey)}__subtree__`;
  }

  private getSubtreePath(fileKey: string, rootNodeId: string): string {
    return path.join(
      this.options.cacheDir,
      `${this.getSubtreePrefix(fileKey)}${sanitizeCacheKey(rootNodeId)}.json`,
    );
  }

  private getSubtreeManifestPath(fileKey: string): string {
    return path.join(this.options.cacheDir, `${sanitizeCacheKey(fileKey)}__subtree-manifest.json`);
  }

  private getSubtreeIndexPath(fileKey: string): string {
    return path.join(this.options.cacheDir, `${sanitizeCacheKey(fileKey)}__subtree-index.json`);
  }

  private isExpired(fetchedAt: number): boolean {
    return Date.now() - fetchedAt > this.options.ttlMs;
  }

  private async readEntry(
    cachePath: string,
  ): Promise<CacheReadResult<GetFileResponse | GetFileNodesResponse> | null> {
    const payload = await this.readJsonFile(cachePath, isStoredCacheEntry);
    if (!payload) {
      return null;
    }

    if (this.isExpired(payload.fetchedAt)) {
      Logger.log(`[FigmaFileCache] Cache expired for ${payload.fileKey}`);
      await this.safeDelete(cachePath);
      return null;
    }

    Logger.log(`[FigmaFileCache] Cache hit for ${payload.fileKey}`);
    return {
      data: payload.data,
      cachedAt: payload.fetchedAt,
      ttlMs: this.options.ttlMs,
      kind: payload.kind,
      fileKey: payload.fileKey,
      rootNodeId: payload.rootNodeId,
    };
  }

  private async writeEntry(cachePath: string, payload: StoredCacheEntry): Promise<void> {
    await this.writeJsonFile(cachePath, payload);
  }

  private async readJsonFile<T>(
    cachePath: string,
    isValid: (value: unknown) => value is T,
  ): Promise<T | null> {
    await this.waitForInit();

    try {
      const fileContents = await readFile(cachePath, "utf-8");
      const payload = JSON.parse(fileContents) as unknown;

      if (!isValid(payload)) {
        Logger.log(`[FigmaFileCache] Cache file corrupted at ${cachePath}, removing`);
        await this.safeDelete(cachePath);
        return null;
      }

      return payload;
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err?.code !== "ENOENT") {
        const message = err?.message ?? String(error);
        Logger.log(`[FigmaFileCache] Error reading cache at ${cachePath}: ${message}`);
        await this.safeDelete(cachePath);
      }
      return null;
    }
  }

  private async writeJsonFile(cachePath: string, payload: unknown): Promise<void> {
    await this.waitForInit();

    const tempPath = `${cachePath}.tmp`;

    try {
      await writeFile(tempPath, JSON.stringify(payload, null, 2));
      await rename(tempPath, cachePath);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Logger.log(`[FigmaFileCache] Failed to write cache at ${cachePath}: ${message}`);
      await this.safeDelete(tempPath);
      throw new Error(`Figma cache write failed: ${message}`);
    }
  }

  private async safeDelete(cachePath: string): Promise<void> {
    try {
      await unlink(cachePath);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      if (err?.code !== "ENOENT") {
        const message = err?.message ?? String(error);
        Logger.log(`[FigmaFileCache] Error deleting cache file: ${message}`);
      }
    }
  }
}

function sanitizeCacheKey(value: string): string {
  return value.replace(/[:/;]/g, "-");
}

function isStoredCacheEntry(value: unknown): value is StoredCacheEntry {
  return (
    isRecord(value) &&
    typeof value.fetchedAt === "number" &&
    (value.kind === "file" || value.kind === "subtree") &&
    typeof value.fileKey === "string" &&
    value.data !== undefined
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
