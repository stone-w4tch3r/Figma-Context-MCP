import { MOCK_FILE_KEY, startMockFigmaServer } from "../src/dev/mock-figma-server.js";

const port = process.env.MOCK_FIGMA_PORT ? Number.parseInt(process.env.MOCK_FIGMA_PORT, 10) : 4010;
const host = process.env.MOCK_FIGMA_HOST || "127.0.0.1";

const { baseUrl, stop } = await startMockFigmaServer({ host, port });

console.log(`Mock Figma server listening at ${baseUrl}`);
console.log(`Mock file key: ${MOCK_FILE_KEY}`);
console.log("Configured roots: 10:20, 10:40");
console.log("Cached descendants: 10:21, 10:22");
console.log("Unrelated node: 99:1");

const shutdown = async () => {
  await stop();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
