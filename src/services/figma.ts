import type {
  DocumentNode,
  GetFileNodesResponse,
  GetFileResponse,
  GetImageFillsResponse,
  GetImagesResponse,
  Node as FigmaNode,
  Transform,
} from "@figma/rest-api-spec";
import { downloadAndProcessImage, type ImageProcessingResult } from "~/utils/image-processing.js";
import { getErrorMeta } from "~/utils/error-meta.js";
import { fetchJSON } from "~/utils/fetch-json.js";
import { Logger, writeLogs } from "~/utils/logger.js";
import { buildForbiddenMessage, buildRateLimitMessage } from "./errors/index.js";
import {
  buildSubtreeConfigSignature,
  FigmaFileCache,
  type FigmaCachingOptions,
  type StoredSubtreeIndex,
} from "./figma-file-cache.js";

export type FigmaAuthOptions = {
  figmaApiKey: string;
  figmaOAuthToken: string;
  useOAuth: boolean;
};

export type CacheInfo = {
  usedCache: boolean;
  cachedAt?: number;
  ttlMs?: number;
};

type SvgOptions = {
  outlineText: boolean;
  includeId: boolean;
  simplifyStroke: boolean;
};

type RawResponse<T> = {
  data: T;
  rawSize: number;
  cacheInfo?: CacheInfo;
};

export class FigmaService {
  private readonly apiKey: string;
  private readonly oauthToken: string;
  private readonly useOAuth: boolean;
  private readonly baseUrl = "https://api.figma.com/v1";
  private readonly fileCache?: FigmaFileCache;
  private readonly subtreeRootsByFile: Record<string, string[]>;
  private readonly cacheTtlMs?: number;
  private readonly subtreeSeedPromises = new Map<string, Promise<void>>();

  constructor(
    { figmaApiKey, figmaOAuthToken, useOAuth }: FigmaAuthOptions,
    cachingOptions?: FigmaCachingOptions,
  ) {
    this.apiKey = figmaApiKey || "";
    this.oauthToken = figmaOAuthToken || "";
    this.useOAuth = !!useOAuth && !!this.oauthToken;
    this.subtreeRootsByFile = cachingOptions?.subtreeRootsByFile ?? {};
    this.cacheTtlMs = cachingOptions?.ttlMs;
    if (cachingOptions) {
      this.fileCache = new FigmaFileCache(cachingOptions);
    }
  }

  private getAuthHeaders(): Record<string, string> {
    if (this.useOAuth) {
      Logger.log("Using OAuth Bearer token for authentication");
      return { Authorization: `Bearer ${this.oauthToken}` };
    }

    Logger.log("Using Personal Access Token for authentication");
    return { "X-Figma-Token": this.apiKey };
  }

  private filterValidImages(
    images: { [key: string]: string | null } | undefined,
  ): Record<string, string> {
    if (!images) return {};
    return Object.fromEntries(Object.entries(images).filter(([, value]) => !!value)) as Record<
      string,
      string
    >;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const { data } = await this.requestWithSize<T>(endpoint);
    return data;
  }

  private async requestWithSize<T>(endpoint: string): Promise<{ data: T; rawSize: number }> {
    try {
      Logger.log(`Calling ${this.baseUrl}${endpoint}`);
      return await fetchJSON<T & { status?: number }>(`${this.baseUrl}${endpoint}`, {
        headers: this.getAuthHeaders(),
        redactFromResponseBody: [this.apiKey, this.oauthToken],
      });
    } catch (error) {
      const meta = getErrorMeta(error);
      if (meta.http_status === 429) {
        throw new Error(buildRateLimitMessage(error), { cause: error });
      }
      if (meta.http_status === 403) {
        throw new Error(buildForbiddenMessage(endpoint, error), { cause: error });
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Failed to make request to Figma API endpoint '${endpoint}': ${errorMessage}`,
        { cause: error },
      );
    }
  }

  private buildSvgQueryParams(svgIds: string[], svgOptions: SvgOptions): string {
    const params = new URLSearchParams({
      ids: svgIds.join(","),
      format: "svg",
      svg_outline_text: String(svgOptions.outlineText),
      svg_include_id: String(svgOptions.includeId),
      svg_simplify_stroke: String(svgOptions.simplifyStroke),
    });
    return params.toString();
  }

  async getImageFillUrls(fileKey: string): Promise<Record<string, string>> {
    const endpoint = `/files/${fileKey}/images`;
    const response = await this.request<GetImageFillsResponse>(endpoint);
    return response.meta.images || {};
  }

  async getNodeRenderUrls(
    fileKey: string,
    nodeIds: string[],
    format: "png" | "svg",
    options: { pngScale?: number; svgOptions?: SvgOptions } = {},
  ): Promise<Record<string, string>> {
    if (nodeIds.length === 0) return {};

    if (format === "png") {
      const scale = options.pngScale || 2;
      const endpoint = `/images/${fileKey}?ids=${nodeIds.join(",")}&format=png&scale=${scale}`;
      const response = await this.request<GetImagesResponse>(endpoint);
      return this.filterValidImages(response.images);
    }

    const svgOptions = options.svgOptions || {
      outlineText: true,
      includeId: false,
      simplifyStroke: true,
    };
    const params = this.buildSvgQueryParams(nodeIds, svgOptions);
    const endpoint = `/images/${fileKey}?${params}`;
    const response = await this.request<GetImagesResponse>(endpoint);
    return this.filterValidImages(response.images);
  }

  async downloadImages(
    fileKey: string,
    localPath: string,
    items: Array<{
      imageRef?: string;
      gifRef?: string;
      nodeId?: string;
      fileName: string;
      needsCropping?: boolean;
      cropTransform?: Transform;
      requiresImageDimensions?: boolean;
    }>,
    options: { pngScale?: number; svgOptions?: SvgOptions } = {},
  ): Promise<ImageProcessingResult[]> {
    if (items.length === 0) return [];

    const resolvedPath = localPath;
    const { pngScale = 2, svgOptions } = options;
    const downloadPromises: Promise<ImageProcessingResult[]>[] = [];

    const imageFills = items.filter(
      (item): item is typeof item & ({ imageRef: string } | { gifRef: string }) =>
        !!item.imageRef || !!item.gifRef,
    );
    const renderNodes = items.filter(
      (item): item is typeof item & { nodeId: string } => !!item.nodeId,
    );

    if (imageFills.length > 0) {
      const fillUrls = await this.getImageFillUrls(fileKey);
      const fillDownloads = imageFills
        .map(
          ({
            imageRef,
            gifRef,
            fileName,
            needsCropping,
            cropTransform,
            requiresImageDimensions,
          }) => {
            const fillRef = gifRef ?? imageRef;
            const imageUrl = fillRef ? fillUrls[fillRef] : undefined;
            return imageUrl
              ? downloadAndProcessImage(
                  fileName,
                  resolvedPath,
                  imageUrl,
                  needsCropping,
                  cropTransform,
                  requiresImageDimensions,
                )
              : null;
          },
        )
        .filter((promise): promise is Promise<ImageProcessingResult> => promise !== null);

      if (fillDownloads.length > 0) {
        downloadPromises.push(Promise.all(fillDownloads));
      }
    }

    if (renderNodes.length > 0) {
      const pngNodes = renderNodes.filter((node) => !node.fileName.toLowerCase().endsWith(".svg"));
      const svgNodes = renderNodes.filter((node) => node.fileName.toLowerCase().endsWith(".svg"));

      if (pngNodes.length > 0) {
        const pngUrls = await this.getNodeRenderUrls(
          fileKey,
          pngNodes.map((n) => n.nodeId),
          "png",
          { pngScale },
        );
        const pngDownloads = pngNodes
          .map(({ nodeId, fileName, needsCropping, cropTransform, requiresImageDimensions }) => {
            const imageUrl = pngUrls[nodeId];
            return imageUrl
              ? downloadAndProcessImage(
                  fileName,
                  resolvedPath,
                  imageUrl,
                  needsCropping,
                  cropTransform,
                  requiresImageDimensions,
                )
              : null;
          })
          .filter((promise): promise is Promise<ImageProcessingResult> => promise !== null);

        if (pngDownloads.length > 0) {
          downloadPromises.push(Promise.all(pngDownloads));
        }
      }

      if (svgNodes.length > 0) {
        const svgUrls = await this.getNodeRenderUrls(
          fileKey,
          svgNodes.map((n) => n.nodeId),
          "svg",
          { svgOptions },
        );
        const svgDownloads = svgNodes
          .map(({ nodeId, fileName, needsCropping, cropTransform, requiresImageDimensions }) => {
            const imageUrl = svgUrls[nodeId];
            return imageUrl
              ? downloadAndProcessImage(
                  fileName,
                  resolvedPath,
                  imageUrl,
                  needsCropping,
                  cropTransform,
                  requiresImageDimensions,
                )
              : null;
          })
          .filter((promise): promise is Promise<ImageProcessingResult> => promise !== null);

        if (svgDownloads.length > 0) {
          downloadPromises.push(Promise.all(svgDownloads));
        }
      }
    }

    const results = await Promise.all(downloadPromises);
    return results.flat();
  }

  async getRawFile(fileKey: string, depth?: number | null): Promise<RawResponse<GetFileResponse>> {
    if (this.fileCache) {
      const cacheResult = await this.loadFileFromCache(fileKey);
      const data =
        typeof depth === "number"
          ? cloneFileResponseWithDepth(cacheResult.data, depth)
          : cacheResult.data;
      writeLogs("figma-raw.json", data);
      return {
        data,
        rawSize: sizeOfJson(data),
        cacheInfo: cacheResult.cacheInfo,
      };
    }

    const endpoint = `/files/${fileKey}${depth ? `?depth=${depth}` : ""}`;
    Logger.log(`Retrieving raw Figma file: ${fileKey} (depth: ${depth ?? "default"})`);
    const result = await this.requestWithSize<GetFileResponse>(endpoint);
    writeLogs("figma-raw.json", result.data);
    return { ...result, cacheInfo: { usedCache: false } };
  }

  async getRawNode(
    fileKey: string,
    nodeId: string,
    depth?: number | null,
  ): Promise<RawResponse<GetFileNodesResponse>> {
    if (this.fileCache?.cacheType === "subtree") {
      const configuredRootNodeIds = this.subtreeRootsByFile[fileKey] ?? [];
      if (configuredRootNodeIds.length > 0) {
        return this.getRawNodeFromSubtreeCache(fileKey, nodeId, configuredRootNodeIds, depth);
      }
    }

    if (this.fileCache) {
      const cacheResult = await this.loadFileFromCache(fileKey);
      const data = buildNodeResponseFromFile(cacheResult.data, nodeId, depth);
      writeLogs("figma-raw.json", data);
      return {
        data,
        rawSize: sizeOfJson(data),
        cacheInfo: cacheResult.cacheInfo,
      };
    }

    const endpoint = `/files/${fileKey}/nodes?ids=${nodeId}${depth ? `&depth=${depth}` : ""}`;
    Logger.log(
      `Retrieving raw Figma node: ${nodeId} from ${fileKey} (depth: ${depth ?? "default"})`,
    );
    const result = await this.requestWithSize<GetFileNodesResponse>(endpoint);
    writeLogs("figma-raw.json", result.data);
    return { ...result, cacheInfo: { usedCache: false } };
  }

  private async loadFileFromCache(
    fileKey: string,
  ): Promise<{ data: GetFileResponse; cacheInfo: CacheInfo }> {
    if (!this.fileCache) {
      throw new Error("File cache is not configured");
    }

    const cacheResult = await this.fileCache.get(fileKey);
    if (cacheResult) {
      return {
        data: cacheResult.data as GetFileResponse,
        cacheInfo: {
          usedCache: true,
          cachedAt: cacheResult.cachedAt,
          ttlMs: cacheResult.ttlMs,
        },
      };
    }

    const endpoint = `/files/${fileKey}`;
    Logger.log(`Retrieving raw Figma file: ${fileKey} (depth: full cache seed)`);
    const fresh = await this.request<GetFileResponse>(endpoint);
    await this.fileCache.set(fileKey, fresh);
    return {
      data: fresh,
      cacheInfo: { usedCache: false },
    };
  }

  private async getRawNodeFromSubtreeCache(
    fileKey: string,
    nodeId: string,
    configuredRootNodeIds: string[],
    depth?: number | null,
  ): Promise<RawResponse<GetFileNodesResponse>> {
    await this.ensureSubtreeSeeded(fileKey, configuredRootNodeIds);

    const cached = await this.loadNodeFromSeededSubtrees(
      fileKey,
      nodeId,
      configuredRootNodeIds,
      depth,
      true,
    );
    if (cached) {
      writeLogs("figma-raw.json", cached.data);
      return cached;
    }

    return this.fetchRawNode(fileKey, nodeId, depth);
  }

  private async ensureSubtreeSeeded(
    fileKey: string,
    configuredRootNodeIds: string[],
  ): Promise<void> {
    if (await this.hasValidSubtreeState(fileKey, configuredRootNodeIds)) {
      return;
    }

    const existingSeed = this.subtreeSeedPromises.get(fileKey);
    if (existingSeed) {
      await existingSeed;
      return;
    }

    const seedPromise = this.seedSubtrees(fileKey, configuredRootNodeIds).finally(() => {
      this.subtreeSeedPromises.delete(fileKey);
    });
    this.subtreeSeedPromises.set(fileKey, seedPromise);
    await seedPromise;
  }

  private async seedSubtrees(fileKey: string, configuredRootNodeIds: string[]): Promise<void> {
    if (!this.fileCache) {
      throw new Error("File cache is not configured");
    }

    const configSignature = buildSubtreeConfigSignature(configuredRootNodeIds);

    try {
      const subtreeResponses = new Map<string, GetFileNodesResponse>();

      for (const rootNodeId of configuredRootNodeIds) {
        const endpoint = `/files/${fileKey}/nodes?ids=${rootNodeId}`;
        Logger.log(`Seeding subtree ${rootNodeId} for ${fileKey}`);
        const response = await this.requestWithSize<GetFileNodesResponse>(endpoint);
        subtreeResponses.set(rootNodeId, response.data);
      }

      const subtreeIndex = buildSubtreeIndex(fileKey, configSignature, subtreeResponses);

      for (const [rootNodeId, response] of subtreeResponses) {
        await this.fileCache.setSubtree(fileKey, rootNodeId, response);
      }

      await this.fileCache.setSubtreeIndex(fileKey, subtreeIndex);
      await this.fileCache.setSubtreeManifest(fileKey, {
        fileKey,
        rootNodeIds: configuredRootNodeIds,
        configSignature,
        seededAt: Date.now(),
      });
    } catch (error: unknown) {
      await this.fileCache.clearSubtreeState(fileKey);
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to seed subtree cache for file ${fileKey}: ${message}`, {
        cause: error,
      });
    }
  }

  private async hasValidSubtreeState(
    fileKey: string,
    configuredRootNodeIds: string[],
  ): Promise<boolean> {
    if (!this.fileCache || !this.cacheTtlMs) {
      return false;
    }

    const manifest = await this.fileCache.getSubtreeManifest(fileKey);
    if (!manifest) {
      return false;
    }

    if (Date.now() - manifest.seededAt > this.cacheTtlMs) {
      return false;
    }

    const configSignature = buildSubtreeConfigSignature(configuredRootNodeIds);
    if (manifest.configSignature !== configSignature) {
      return false;
    }

    const index = await this.fileCache.getSubtreeIndex(fileKey);
    if (!index || index.configSignature !== configSignature) {
      return false;
    }

    for (const rootNodeId of configuredRootNodeIds) {
      const subtree = await this.fileCache.getSubtree(fileKey, rootNodeId);
      if (!subtree) {
        return false;
      }
    }

    return true;
  }

  private async loadNodeFromSeededSubtrees(
    fileKey: string,
    nodeId: string,
    configuredRootNodeIds: string[],
    depth: number | null | undefined,
    allowReseed: boolean,
  ): Promise<RawResponse<GetFileNodesResponse> | null> {
    if (!this.fileCache) {
      return null;
    }

    const directSubtree = configuredRootNodeIds.includes(nodeId)
      ? await this.fileCache.getSubtree(fileKey, nodeId)
      : null;
    if (directSubtree) {
      const data = buildNodeResponseFromSubtree(directSubtree.data, nodeId, depth);
      return {
        data,
        rawSize: sizeOfJson(data),
        cacheInfo: {
          usedCache: true,
          cachedAt: directSubtree.cachedAt,
          ttlMs: directSubtree.ttlMs,
        },
      };
    }

    const index = await this.fileCache.getSubtreeIndex(fileKey);
    const ownerRootNodeId = index?.nodeToRoot[nodeId];
    if (!ownerRootNodeId) {
      return null;
    }

    const owningSubtree = await this.fileCache.getSubtree(fileKey, ownerRootNodeId);
    if (!owningSubtree) {
      if (!allowReseed) {
        return null;
      }

      await this.fileCache.clearSubtreeState(fileKey);
      await this.ensureSubtreeSeeded(fileKey, configuredRootNodeIds);
      return this.loadNodeFromSeededSubtrees(fileKey, nodeId, configuredRootNodeIds, depth, false);
    }

    const data = buildNodeResponseFromSubtree(owningSubtree.data, nodeId, depth);
    return {
      data,
      rawSize: sizeOfJson(data),
      cacheInfo: {
        usedCache: true,
        cachedAt: owningSubtree.cachedAt,
        ttlMs: owningSubtree.ttlMs,
      },
    };
  }

  private async fetchRawNode(
    fileKey: string,
    nodeId: string,
    depth?: number | null,
  ): Promise<RawResponse<GetFileNodesResponse>> {
    const endpoint = `/files/${fileKey}/nodes?ids=${nodeId}${depth ? `&depth=${depth}` : ""}`;
    Logger.log(
      `Retrieving raw Figma node: ${nodeId} from ${fileKey} (depth: ${depth ?? "default"})`,
    );
    const result = await this.requestWithSize<GetFileNodesResponse>(endpoint);
    writeLogs("figma-raw.json", result.data);
    return { ...result, cacheInfo: { usedCache: false } };
  }
}

function sizeOfJson(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

function cloneFileResponseWithDepth(file: GetFileResponse, depth: number): GetFileResponse {
  return {
    ...file,
    document: cloneNode(file.document, depth) as DocumentNode,
  };
}

function cloneNode<T extends FigmaNode>(node: T, depth?: number): T {
  const clone = { ...node } as T & { children?: FigmaNode[] };

  if (!nodeHasChildren(node)) {
    delete clone.children;
    return clone;
  }

  if (depth === undefined || depth === null) {
    clone.children = node.children.map((child) => cloneNode(child));
    return clone;
  }

  if (depth <= 0) {
    delete clone.children;
    return clone;
  }

  clone.children = node.children.map((child) => cloneNode(child, depth - 1));
  return clone;
}

function buildNodeResponseFromFile(
  file: GetFileResponse,
  nodeIdParam: string,
  depth?: number | null,
): GetFileNodesResponse {
  const nodeIds = nodeIdParam.split(";").filter((id) => id);
  if (nodeIds.length === 0) {
    throw new Error("No valid node IDs provided");
  }

  const nodesMap = findNodesById(file.document, new Set(nodeIds));
  const nodes: GetFileNodesResponse["nodes"] = {};

  for (const id of nodeIds) {
    const node = nodesMap.get(id);
    if (!node) {
      throw new Error(`Node ${id} not found in cached file`);
    }

    nodes[id] = {
      document: cloneNode(node, depth ?? undefined),
      components: file.components ?? {},
      componentSets: file.componentSets ?? {},
      styles: file.styles,
      schemaVersion: file.schemaVersion,
    };
  }

  return {
    name: file.name,
    lastModified: file.lastModified,
    thumbnailUrl: file.thumbnailUrl ?? "",
    version: file.version ?? "",
    role: file.role ?? "viewer",
    editorType: file.editorType ?? "figma",
    nodes,
  };
}

function buildNodeResponseFromSubtree(
  subtree: GetFileNodesResponse,
  nodeId: string,
  depth?: number | null,
): GetFileNodesResponse {
  const [rootNodeEntry] = Object.values(subtree.nodes);
  if (!rootNodeEntry) {
    throw new Error(`Node ${nodeId} not found in cached subtree`);
  }

  const node = findNodesById(rootNodeEntry.document as DocumentNode, new Set([nodeId])).get(nodeId);
  if (!node) {
    throw new Error(`Node ${nodeId} not found in cached subtree`);
  }

  return {
    name: subtree.name,
    lastModified: subtree.lastModified,
    thumbnailUrl: subtree.thumbnailUrl ?? "",
    version: subtree.version ?? "",
    role: subtree.role ?? "viewer",
    editorType: subtree.editorType ?? "figma",
    nodes: {
      [nodeId]: {
        document: cloneNode(node, depth ?? undefined),
        components: rootNodeEntry.components ?? {},
        componentSets: rootNodeEntry.componentSets ?? {},
        styles: rootNodeEntry.styles,
        schemaVersion: rootNodeEntry.schemaVersion,
      },
    },
  };
}

function findNodesById(root: DocumentNode, targetIds: Set<string>): Map<string, FigmaNode> {
  const result = new Map<string, FigmaNode>();
  const stack: FigmaNode[] = [root];

  while (stack.length > 0 && result.size < targetIds.size) {
    const current = stack.pop();
    if (!current) continue;

    if (targetIds.has(current.id)) {
      result.set(current.id, current);
    }

    if (nodeHasChildren(current)) {
      stack.push(...current.children);
    }
  }

  return result;
}

function buildSubtreeIndex(
  fileKey: string,
  configSignature: string,
  subtreeResponses: Map<string, GetFileNodesResponse>,
): StoredSubtreeIndex {
  const nodeToRoot: Record<string, string> = {};

  for (const [rootNodeId, subtreeResponse] of subtreeResponses) {
    const rootNodeEntry =
      subtreeResponse.nodes[rootNodeId] ?? Object.values(subtreeResponse.nodes)[0];
    if (!rootNodeEntry) {
      throw new Error(`Configured subtree root ${rootNodeId} was missing from seed response`);
    }

    const stack: FigmaNode[] = [rootNodeEntry.document as FigmaNode];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;

      const owner = nodeToRoot[current.id];
      if (owner && owner !== rootNodeId) {
        throw new Error(
          `Invalid subtree cache index for file ${fileKey}: overlapping subtree roots ${owner} and ${rootNodeId}`,
        );
      }

      nodeToRoot[current.id] = rootNodeId;

      if (nodeHasChildren(current)) {
        stack.push(...current.children);
      }
    }
  }

  return {
    fileKey,
    configSignature,
    nodeToRoot,
  };
}

type NodeWithChildren = FigmaNode & { children: FigmaNode[] };

function nodeHasChildren(node: FigmaNode): node is NodeWithChildren {
  const maybeChildren = (node as Partial<NodeWithChildren>).children;
  return Array.isArray(maybeChildren) && maybeChildren.length > 0;
}
