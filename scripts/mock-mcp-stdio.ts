import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { getServerConfig } from "../src/config.js";
import { createServer } from "../src/mcp/index.js";

const config = getServerConfig({
  stdio: true,
  figmaApiKey: process.env.FIGMA_API_KEY || "test-key",
  json: process.argv.includes("--json"),
  noTelemetry: process.argv.includes("--no-telemetry"),
});

config.auth.baseUrl = process.env.MOCK_FIGMA_API_BASE_URL || "http://127.0.0.1:4010/v1";

const server = createServer(config.auth, {
  transport: "stdio",
  outputFormat: config.outputFormat,
  skipImageDownloads: config.skipImageDownloads,
  imageDir: config.imageDir,
  caching: config.caching,
});

const transport = new StdioServerTransport();
await server.connect(transport);
