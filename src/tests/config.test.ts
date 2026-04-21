import { afterEach, describe, expect, it, vi } from "vitest";
import { envBool, envInt, envStr, getServerConfig, resolve } from "~/config.js";

describe("resolve", () => {
  it("CLI flag wins over env and default", () => {
    const result = resolve("from-cli", "from-env", "fallback");
    expect(result).toEqual({ value: "from-cli", source: "cli" });
  });

  it("env wins over default when flag is undefined", () => {
    const result = resolve(undefined, "from-env", "fallback");
    expect(result).toEqual({ value: "from-env", source: "env" });
  });

  it("default is used when both flag and env are undefined", () => {
    const result = resolve(undefined, undefined, "fallback");
    expect(result).toEqual({ value: "fallback", source: "default" });
  });

  it("preserves falsy flag values (false, 0) instead of falling through", () => {
    expect(resolve(false, true, true)).toEqual({ value: false, source: "cli" });
    expect(resolve(0, 42, 99)).toEqual({ value: 0, source: "cli" });
  });
});

describe("envStr", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the env var value when set", () => {
    vi.stubEnv("TEST_STR", "hello");
    expect(envStr("TEST_STR")).toBe("hello");
  });

  it("returns undefined when env var is not set", () => {
    expect(envStr("TEST_STR_MISSING")).toBeUndefined();
  });

  it("returns undefined when env var is empty string", () => {
    vi.stubEnv("TEST_STR_EMPTY", "");
    expect(envStr("TEST_STR_EMPTY")).toBeUndefined();
  });
});

describe("envInt", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns parsed integer when set", () => {
    vi.stubEnv("TEST_INT", "42");
    expect(envInt("TEST_INT")).toBe(42);
  });

  it("tries names in order and returns first match", () => {
    vi.stubEnv("TEST_INT_B", "99");
    expect(envInt("TEST_INT_A", "TEST_INT_B")).toBe(99);
  });

  it("returns undefined when none of the names are set", () => {
    expect(envInt("NOPE_A", "NOPE_B")).toBeUndefined();
  });
});

describe("envBool", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns true for "true"', () => {
    vi.stubEnv("TEST_BOOL", "true");
    expect(envBool("TEST_BOOL")).toBe(true);
  });

  it('returns false for "false"', () => {
    vi.stubEnv("TEST_BOOL", "false");
    expect(envBool("TEST_BOOL")).toBe(false);
  });

  it("returns undefined for any other value", () => {
    vi.stubEnv("TEST_BOOL", "yes");
    expect(envBool("TEST_BOOL")).toBeUndefined();
  });

  it("returns undefined when not set", () => {
    expect(envBool("TEST_BOOL_MISSING")).toBeUndefined();
  });
});

describe("getServerConfig caching", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("accepts subtree cache mode with subtree roots by file", () => {
    vi.stubEnv(
      "FIGMA_CACHING",
      JSON.stringify({
        cacheType: "subtree",
        cacheDir: ".cache/figma",
        subtreeRootsByFile: { FILE123: ["10:20"] },
        ttl: { value: 1, unit: "d" },
      }),
    );

    const config = getServerConfig({ stdio: true, figmaApiKey: "test-key" });

    expect(config.caching).toMatchObject({
      cacheType: "subtree",
      subtreeRootsByFile: { FILE123: ["10:20"] },
    });
  });

  it("defaults omitted cacheType to default", () => {
    vi.stubEnv(
      "FIGMA_CACHING",
      JSON.stringify({
        cacheDir: ".cache/figma",
        ttl: { value: 1, unit: "d" },
      }),
    );

    const config = getServerConfig({ stdio: true, figmaApiKey: "test-key" });

    expect(config.caching?.cacheType).toBe("default");
  });

  it("rejects cacheType node", () => {
    expectConfigExit({
      cacheType: "node",
      cacheDir: ".cache/figma",
      ttl: { value: 1, unit: "d" },
    });
  });

  it("rejects subtree mode without subtreeRootsByFile", () => {
    expectConfigExit({
      cacheType: "subtree",
      cacheDir: ".cache/figma",
      ttl: { value: 1, unit: "d" },
    });
  });

  it("rejects empty subtreeRootsByFile", () => {
    expectConfigExit({
      cacheType: "subtree",
      cacheDir: ".cache/figma",
      subtreeRootsByFile: {},
      ttl: { value: 1, unit: "d" },
    });
  });

  it("rejects file entries with empty root arrays", () => {
    expectConfigExit({
      cacheType: "subtree",
      cacheDir: ".cache/figma",
      subtreeRootsByFile: { FILE123: [] },
      ttl: { value: 1, unit: "d" },
    });
  });

  it("rejects duplicate root IDs within one file entry", () => {
    expectConfigExit({
      cacheType: "subtree",
      cacheDir: ".cache/figma",
      subtreeRootsByFile: { FILE123: ["10:20", "10:20"] },
      ttl: { value: 1, unit: "d" },
    });
  });
});

function expectConfigExit(cachingConfig: object): void {
  vi.stubEnv("FIGMA_CACHING", JSON.stringify(cachingConfig));

  const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  const exitSpy = vi.spyOn(process, "exit").mockImplementation((code?: string | number | null) => {
    throw new Error(`process.exit:${code ?? "undefined"}`);
  }) as never;

  expect(() => getServerConfig({ stdio: true, figmaApiKey: "test-key" })).toThrow(
    /process\.exit:1/,
  );

  expect(errorSpy).toHaveBeenCalled();
  expect(exitSpy).toHaveBeenCalledWith(1);
}
