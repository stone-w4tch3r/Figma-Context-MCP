import express from "express";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import type { Express } from "express";
import type { GetFileNodesResponse } from "@figma/rest-api-spec";

const MOCK_FILE_KEY = "mocksubtreefile";

type MockNode = {
  id: string;
  name: string;
  type: "FRAME" | "GROUP";
  children: MockNode[];
};

const ROOT_A: MockNode = {
  id: "10:20",
  name: "Configured Root A",
  type: "FRAME",
  children: [
    {
      id: "10:21",
      name: "Descendant",
      type: "FRAME",
      children: [
        {
          id: "10:22",
          name: "Grandchild",
          type: "GROUP",
          children: [],
        },
      ],
    },
  ],
};

const ROOT_B: MockNode = {
  id: "10:40",
  name: "Configured Root B",
  type: "FRAME",
  children: [],
};

const UNRELATED: MockNode = {
  id: "99:1",
  name: "Unrelated Node",
  type: "FRAME",
  children: [],
};

const NODES_BY_ID = new Map<string, MockNode>([
  [ROOT_A.id, ROOT_A],
  [ROOT_A.children[0].id, ROOT_A.children[0]],
  [ROOT_A.children[0].children[0].id, ROOT_A.children[0].children[0]],
  [ROOT_B.id, ROOT_B],
  [UNRELATED.id, UNRELATED],
]);

type StartMockFigmaServerOptions = {
  host?: string;
  port?: number;
};

export function createMockFigmaApp(): Express {
  const app = express();

  app.get("/v1/files/:fileKey/nodes", (req, res) => {
    const { fileKey } = req.params;
    const ids = typeof req.query.ids === "string" ? req.query.ids.split(",") : [];
    const depth = parseDepth(req.query.depth);

    if (fileKey !== MOCK_FILE_KEY) {
      res.status(404).json({ status: 404, err: `Unknown mock file '${fileKey}'` });
      return;
    }

    if (ids.length !== 1) {
      res.status(400).json({ status: 400, err: "Mock server expects exactly one node id" });
      return;
    }

    const node = NODES_BY_ID.get(ids[0]);
    if (!node) {
      res.status(404).json({ status: 404, err: `Unknown mock node '${ids[0]}'` });
      return;
    }

    res.json(buildNodeResponse(node, depth));
  });

  return app;
}

export async function startMockFigmaServer({
  host = "127.0.0.1",
  port = 4010,
}: StartMockFigmaServerOptions = {}): Promise<{
  server: Server;
  baseUrl: string;
  stop: () => Promise<void>;
}> {
  const app = createMockFigmaApp();
  const server = createServer(app);

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      server.off("error", reject);
      resolve();
    });
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://${host}:${address.port}/v1`;

  return {
    server,
    baseUrl,
    stop: () =>
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      }),
  };
}

export { MOCK_FILE_KEY };

function buildNodeResponse(node: MockNode, depth?: number): GetFileNodesResponse {
  const document = cloneNode(node, depth);

  return {
    name: "Mock subtree cache file",
    lastModified: "2026-04-21T00:00:00.000Z",
    thumbnailUrl: "",
    version: "1",
    role: "viewer",
    editorType: "figma",
    schemaVersion: 0,
    linkAccess: "view",
    nodes: {
      [node.id]: {
        document,
        components: {},
        componentSets: {},
        styles: {},
      },
    },
  } as unknown as GetFileNodesResponse;
}

function cloneNode(node: MockNode, depth?: number): MockNode {
  return {
    ...node,
    children:
      depth === 0
        ? []
        : node.children.map((child) =>
            cloneNode(child, depth === undefined ? undefined : depth - 1),
          ),
  };
}

function parseDepth(depth: unknown): number | undefined {
  if (typeof depth !== "string") {
    return undefined;
  }

  const parsed = Number.parseInt(depth, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}
