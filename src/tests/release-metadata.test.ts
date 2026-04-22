import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "../..");

function readJson(relativePath: string): any {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relativePath), "utf8"));
}

describe("release metadata", () => {
  it("keeps server.json version fields in sync with package.json", () => {
    const packageJson = readJson("package.json");
    const serverJson = readJson("server.json");

    expect(serverJson.version).toBe(packageJson.version);
    expect(serverJson.packages[0]?.version).toBe(packageJson.version);
  });

  it("configures release-please to update server.json during releases", () => {
    const releasePleaseConfig = readJson("release-please-config.json");

    expect(releasePleaseConfig["extra-files"]).toEqual(
      expect.arrayContaining([
        {
          type: "json",
          path: "server.json",
          jsonpath: "$.version",
        },
        {
          type: "json",
          path: "server.json",
          jsonpath: "$.packages[0].version",
        },
      ]),
    );
  });
});
