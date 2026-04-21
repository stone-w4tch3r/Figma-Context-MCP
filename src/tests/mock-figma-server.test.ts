import { afterEach, describe, expect, it } from "vitest";
import type { AddressInfo } from "node:net";
import { FigmaService, type FigmaAuthOptions } from "~/services/figma.js";
import { MOCK_FILE_KEY, startMockFigmaServer } from "~/dev/mock-figma-server.js";

const auth: FigmaAuthOptions = {
  figmaApiKey: "test-key",
  figmaOAuthToken: "",
  useOAuth: false,
  baseUrl: "",
};

describe("mock Figma server", () => {
  let stopServer: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await stopServer?.();
    stopServer = undefined;
  });

  it("serves deterministic node payloads through FigmaService", async () => {
    const { server, stop } = await startMockFigmaServer({ port: 0 });
    stopServer = stop;
    const port = (server.address() as AddressInfo).port;
    const service = new FigmaService({
      ...auth,
      baseUrl: `http://127.0.0.1:${port}/v1`,
    });

    const response = await service.getRawNode(MOCK_FILE_KEY, "10:20");
    const rootNode = response.data.nodes["10:20"]?.document as
      | { children?: Array<{ id: string; children?: Array<{ id: string }> }> }
      | undefined;

    expect(rootNode?.children?.map((child) => child.id)).toEqual(["10:21"]);
    expect(rootNode?.children?.[0]?.children?.map((child) => child.id)).toEqual(["10:22"]);

    const unrelated = await service.getRawNode(MOCK_FILE_KEY, "99:1");
    expect(unrelated.data.nodes["99:1"]?.document.id).toBe("99:1");
  });
});
