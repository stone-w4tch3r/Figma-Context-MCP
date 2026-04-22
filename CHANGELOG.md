# figma-developer-mcp

## [0.20.0](https://github.com/stone-w4tch3r/Figma-Context-MCP/compare/v0.19.0...v0.20.0) (2026-04-22)


### Features

* replace node cache mode with subtree seeding ([dd700e7](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/dd700e74a90843353adfe4b0527349b5caf3cbb9))


### Bug Fixes

* clarify subtree caching README docs ([de80cf4](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/de80cf47e9f4186293d300ef2da4f2f6812603bf))
* handle missing frame children in alignItems ([4f5e0d5](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/4f5e0d56dd02ccf067f74b1743e53ad810a50c62))

## [0.19.0](https://github.com/stone-w4tch3r/Figma-Context-MCP/compare/v0.18.0...v0.19.0) (2026-04-21)


### Features

* add node-level cache granularity via cacheType option ([4ac5758](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/4ac5758b4d8903412ba0e8ad293df3febc8c4453))

## [0.18.0](https://github.com/stone-w4tch3r/Figma-Context-MCP/compare/v0.17.1...v0.18.0) (2026-04-21)


### ⚠ BREAKING CHANGES

* switch to stateless HTTP transport ([#304](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/304))
* getServerConfig() no longer takes an isStdioMode parameter. It now detects stdio mode internally and returns it as part of ServerConfig.

### Features

* add --image-dir config for image download path control ([#297](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/297)) ([0417766](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/0417766eb5fc1e0b76e55da497961f9aee2f62f7))
* add anonymous PostHog telemetry ([#342](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/342)) ([6c0666a](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/6c0666a7c96e62b39f730a96d24eacb8f3a35cf6))
* add component property support (BOOLEAN & TEXT) ([#340](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/340)) ([b0f9efc](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/b0f9efcc0680012eac4a760ec6826a7605b38fb6))
* add progress notifications and async tree walker ([#305](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/305)) ([b5724ad](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/b5724ade8234e73fe94467c6bfad5e020552f0e2))
* add proxy support for managed networks ([#338](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/338)) ([32d5779](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/32d57790317e57a35dfc8df0de4c6ac830268b31))
* add support for using as a CLI via `fetch` subcommand to retrieve design data directly ([#331](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/331)) ([dd237c8](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/dd237c8e87565cee42d706b8f374fc4bc411066b))
* replace yargs with cleye for CLI flag parsing ([#285](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/285)) ([0092ee7](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/0092ee789fce01b9ef1dab5e8f32c52e71107dbb))
* rich text styling ([#351](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/351)) ([759d0e4](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/759d0e4f7877677980d9cee18c8f895bee655394))
* support gifRef for downloading animated GIF embeds ([#286](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/286)) ([f1ec913](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/f1ec9133c31a351b55651126c20ea2f842c0a9ee))


### Bug Fixes

* add actionable 403 error message with troubleshooting link ([9230bd0](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/9230bd02a63085d88ca5d3687275f2cba9557309))
* disambiguate named styles with duplicate names ([#319](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/319)) ([a077ace](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/a077ace9809bf6b14c4e4a9906065fb3cea2d24f))
* handle drive root paths in image directory security check ([#301](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/301)) ([9f32616](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/9f32616caa29b1dbdd5c5a9dcfafa3dd717070a3))
* include BOOLEAN_OPERATION in SVG container collapse ([354679e](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/354679eab17389c551a435ca7c5224a250446301))
* include BOOLEAN_OPERATION in SVG container collapse ([19c50b3](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/19c50b3ad3ecf12ce4b4bedc0aefff718b3b89f9))
* **layout:** suppress computed gap values when using SPACE_BETWEEN ([#341](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/341)) ([309c60e](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/309c60e6d59eb2fb8fdc0acc85dd81b1644b1f12)), closes [#169](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/169)
* remove inline release-type so release-please reads config file ([a03cd68](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/a03cd68826da1c1596273a223a612eb919832397))
* replace jimp with selective @jimp/* imports to fix ESM crash ([#333](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/333)) ([dd47ebf](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/dd47ebf82520c6147b913415db99c3b4caaa40b2)), closes [#329](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/329)
* replace sharp dependency with js-native jimp for image manipulation ([#289](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/289)) ([62b9f94](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/62b9f94b1607dd08daeaa90e8ace0a896fe6eb50))
* skip jimp processing for SVGs and prevent image-fill collapse ([#298](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/298)) ([a4a4b13](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/a4a4b13ec7cae5d603022b1c8719cc717749195b))
* stop routing all traffic through EnvHttpProxyAgent by default ([#359](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/359)) ([a22f28f](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/a22f28f23f9cf5444d509b9d041d3c162e1cefd6))
* surface Figma 403 response body to help LLMs self-heal based on actual error ([#360](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/360)) ([12280ba](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/12280ba22a8d398c35db360a336356430dd0b182))
* throw actionable error for missing nodes, add error_category to telemetry ([#344](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/344)) ([334ae2b](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/334ae2bbecbd3583922098787877448337acf6cb))


### Performance Improvements

* fix O(n²) bottlenecks in simplification and YAML serialization ([#307](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/307)) ([29cff0c](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/29cff0cbd6d2fd0459900e9c3cbc49f64e47075d))


### Code Refactoring

* switch to stateless HTTP transport ([#304](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/304)) ([9dfb1cb](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/9dfb1cb65a081655d7dca5f076ab76f5d7e9edc0))

## [0.17.1](https://github.com/stone-w4tch3r/Figma-Context-MCP/compare/v0.17.0...v0.17.1) (2026-03-11)


### Bug Fixes

* upgrade MCP SDK to 1.27.1 and modernize tool registration ([#282](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/282)) ([4153e5f](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/4153e5f857aa708ee9ee10156e553c1289f03cf7))
* use Node 24 in release workflow for npm OIDC support ([11ba7c6](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/11ba7c6a2e22910c483592ba7cdc1966fcdc9166))

## [0.17.0](https://github.com/stone-w4tch3r/Figma-Context-MCP/compare/v0.16.0...v0.17.0) (2026-02-26)


### Features

* Extracting global variables ([bb52df2](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/bb52df2835a7d34b588ab553e8807ff4c1a3d356))
* Extracting global variables ([03143b8](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/03143b834385176b474bed22660120dd36a86970))
* Include component and component set names to help LLMs find pre-existing components in code ([#122](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/122)) ([60c663e](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/60c663e6a83886b03eb2cde7c60433439e2cedd0))
* **security:** add input validation to download images tool ([#207](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/207)) ([651974e](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/651974e6f31a3b60b863dab12e69029c710dd1c0))
* **security:** add path sanitization to prevent directory traversal ([#206](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/206)) ([5a18eef](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/5a18eef889b0449894e835f71b15786e4e36dd10))
* sync fork with upstream - release-please migration, vitest, repo cleanup ([2124f43](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/2124f43fa5a27135c06b53b1da6b8e3733990be4))


### Bug Fixes

* add NODE_AUTH_TOKEN to npm publish step in release workflow ([f82d614](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/f82d614e932e90d779255e81d58a19eb2098cfdd))
* Cannot find module '~/transformers/layout' ([7432d6c](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/7432d6ca28796327aec9f4fdd4b2948b95b49a08))
* Cannot find module '~/transformers/layout' ([82a52f7](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/82a52f7e4b349268995633f229e03ee034cce8b5))
* configure pnpm npmrc for npm registry auth in release workflow ([355ddcb](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/355ddcb9b99929f0061deecb7c8f61ec527b8380))
* enhance fetchWithRetry to handle error statuses in response body ([803a479](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/803a479c2a3f0e8b8636f498728b5aaca2e30580))
* Fix bug where MCP cannot be invoked by cursor 0.45.11 ([dbea364](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/dbea36451cbf68f6d1dd814fed01743a1fdd27f4))
* Make sure LLM provides a filename extension when calling download_figma_images ([00bad7d](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/00bad7dae48a6d0cc55d78560cc691a39271f151))
* README.zh-tw typo ([#236](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/236)) ([c65c25c](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/c65c25c16f19c7f05c05f976b26cc5fbd2bcb19a))
* Remove empty keys from simplified design output ([#106](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/106)) ([4237a53](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/4237a5363f696dcf7abe046940180b6861bdcf22))
* Replaced the NODE_ENV setting with cross-env to improve cross-platform compatibility. ([#19](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/19)) ([a0eeed5](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/a0eeed588002915df1489346880372a5896b3fdb))
* update Node ID regex to support additional formats in download i… ([#227](https://github.com/stone-w4tch3r/Figma-Context-MCP/issues/227)) ([68fbc87](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/68fbc87645d25c57252d4d9bec5f43ee4238b09f))
* use correct secret name NPM_ACCESS_TOKEN in release workflow ([6800cbe](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/6800cbe2bed8e379922bca85e56e46cdc42c83ec))
* use npm publish instead of pnpm publish for registry auth ([69cdcc2](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/69cdcc23bbab93c7642ec039dae903426d8ca911))
* write project-level .npmrc for pnpm publish auth ([c93f485](https://github.com/stone-w4tch3r/Figma-Context-MCP/commit/c93f485c73a584b3768a37baa96ba5621a0ba5b2))

## 0.9.0

### Minor Changes

- [#261](https://github.com/GLips/Figma-Context-MCP/pull/261) [`c730417`](https://github.com/GLips/Figma-Context-MCP/commit/c73041730cb2b288a32c6c6ba4b48d8970841659) Thanks [@jnhyperion](https://github.com/jnhyperion)! - Add configurable `--host` CLI option for remote deployments. Use `--host` CLI argument or `FRAMELINK_HOST` environment variable to bind to addresses other than localhost (e.g., `0.0.0.0` for network access).

  Also adds `FRAMELINK_PORT` environment variable (with backwards-compatible fallback to `PORT`).

## 0.8.0

### Minor Changes

- [`6c76c95`](https://github.com/GLips/Figma-Context-MCP/commit/6c76c950f498a9760dd37e380ceca223e7d0093b) Thanks [@stone-w4tch3r](https://github.com/stone-w4tch3r)! - added caching support + repackage tmp fork version to npm

## [0.6.6](https://github.com/GLips/Figma-Context-MCP/compare/v0.6.5...v0.6.6) (2026-03-04)


### Bug Fixes

* use Node 24 in release workflow for npm OIDC support ([11ba7c6](https://github.com/GLips/Figma-Context-MCP/commit/11ba7c6a2e22910c483592ba7cdc1966fcdc9166))

## [0.6.5](https://github.com/GLips/Figma-Context-MCP/compare/v0.6.4...v0.6.5) (2026-03-04)


### Bug Fixes

* upgrade MCP SDK to 1.27.1 and modernize tool registration ([#282](https://github.com/GLips/Figma-Context-MCP/issues/282)) ([4153e5f](https://github.com/GLips/Figma-Context-MCP/commit/4153e5f857aa708ee9ee10156e553c1289f03cf7))

## 0.6.4

### Patch Changes

- [#250](https://github.com/GLips/Figma-Context-MCP/pull/250) [`9966623`](https://github.com/GLips/Figma-Context-MCP/commit/996662352cdeaa8e6d4a6f64154d6135c00a35ee) Thanks [@GLips](https://github.com/GLips)! - Collapse containers that only have vector children to better handle SVG image downloads and also make output size smaller.

## 0.6.3

### Patch Changes

- [#246](https://github.com/GLips/Figma-Context-MCP/pull/246) [`7f4b585`](https://github.com/GLips/Figma-Context-MCP/commit/7f4b5859454b0567c2121ff22c69a0344680b124) Thanks [@GLips](https://github.com/GLips)! - Updates to validate user input, run HTTP server on localhost only

## 0.6.2

### Patch Changes

- [#244](https://github.com/GLips/Figma-Context-MCP/pull/244) [`8277424`](https://github.com/GLips/Figma-Context-MCP/commit/8277424205e6421a133ac38086f6eb7ac124ea65) Thanks [@GLips](https://github.com/GLips)! - Support imports without starting server or looking for env vars.

## 0.6.1

### Patch Changes

- [#240](https://github.com/GLips/Figma-Context-MCP/pull/240) [`2b1923d`](https://github.com/GLips/Figma-Context-MCP/commit/2b1923dcf50275a3d4daf9279265d27c6fadb2f7) Thanks [@GLips](https://github.com/GLips)! - Fix issue where importing package triggered config check.

- [#239](https://github.com/GLips/Figma-Context-MCP/pull/239) [`00bad7d`](https://github.com/GLips/Figma-Context-MCP/commit/00bad7dae48a6d0cc55d78560cc691a39271f151) Thanks [@Hengkai-Ye](https://github.com/Hengkai-Ye)! - Fix: Make sure LLM provides a filename extension when calling download_figma_images

## 0.6.0

### Minor Changes

- [#233](https://github.com/GLips/Figma-Context-MCP/pull/233) [`26a048b`](https://github.com/GLips/Figma-Context-MCP/commit/26a048bbd09db2b7e5265b5777609fb619617068) Thanks [@scarf005](https://github.com/scarf005)! - Return named styles from Figma instead of auto-generated IDs when they exist.

## 0.5.2

### Patch Changes

- [#227](https://github.com/GLips/Figma-Context-MCP/pull/227) [`68fbc87`](https://github.com/GLips/Figma-Context-MCP/commit/68fbc87645d25c57252d4d9bec5f43ee4238b09f) Thanks [@fightZy](https://github.com/fightZy)! - Update Node ID regex to support additional formats, e.g. multiple nodes.

## 0.5.1

### Patch Changes

- [#205](https://github.com/GLips/Figma-Context-MCP/pull/205) [`618bbe9`](https://github.com/GLips/Figma-Context-MCP/commit/618bbe98c49428e617de0240f0e9c2842867ae9b) Thanks [@GLips](https://github.com/GLips)! - Calculate gradient values instead of passing raw Figma data.

## 0.5.0

### Minor Changes

- [#197](https://github.com/GLips/Figma-Context-MCP/pull/197) [`d67ff14`](https://github.com/GLips/Figma-Context-MCP/commit/d67ff143347bb1dbc152157b75d6e8b290dabb0f) Thanks [@GLips](https://github.com/GLips)! - Improve structure of MCP files, change strategy used for parsing Figma files to make it more flexible and extensible.

- [#199](https://github.com/GLips/Figma-Context-MCP/pull/199) [`a8b59bf`](https://github.com/GLips/Figma-Context-MCP/commit/a8b59bf079128c9dba0bf6d8cd1601b8a6654b88) Thanks [@GLips](https://github.com/GLips)! - Add support for pattern fills in Figma.

- [#203](https://github.com/GLips/Figma-Context-MCP/pull/203) [`edf4182`](https://github.com/GLips/Figma-Context-MCP/commit/edf41826f5bd4ebe6ea353a9c9b8be669f0ae659) Thanks [@GLips](https://github.com/GLips)! - Add support for Fill, Fit, Crop and Tile image types in Figma. Adds image post-processing step.

### Patch Changes

- [#202](https://github.com/GLips/Figma-Context-MCP/pull/202) [`4a44681`](https://github.com/GLips/Figma-Context-MCP/commit/4a44681903f1c071c5892454d19370ed89ecd0a3) Thanks [@GLips](https://github.com/GLips)! - Add --skip-image-downloads option to CLI args and SKIP_IMAGE_DOWNLOADS env var to hide the download image tool when set.

## 0.4.3

### Patch Changes

- [#179](https://github.com/GLips/Figma-Context-MCP/pull/179) [`17988a0`](https://github.com/GLips/Figma-Context-MCP/commit/17988a0b5543330c6b8f7f24baa33b65a0da7957) Thanks [@GLips](https://github.com/GLips)! - Update curl command in fetchWithRetry to include error handling options, ensure errors are actually caught properly and returned to users.

## 0.4.2

### Patch Changes

- [#170](https://github.com/GLips/Figma-Context-MCP/pull/170) [`d560252`](https://github.com/GLips/Figma-Context-MCP/commit/d56025286e8c3c24d75f170974c12f96d32fda8b) Thanks [@GLips](https://github.com/GLips)! - Add support for custom .env files.

## 0.4.1

### Patch Changes

- [#161](https://github.com/GLips/Figma-Context-MCP/pull/161) [`8d34c6c`](https://github.com/GLips/Figma-Context-MCP/commit/8d34c6c23df3b2be5d5366723aeefdc2cca0a904) Thanks [@YossiSaadi](https://github.com/YossiSaadi)! - Add --json CLI flag and OUTPUT_FORMAT env var to support JSON output format in addition to YAML.

## 0.4.0

### Minor Changes

- [#126](https://github.com/GLips/Figma-Context-MCP/pull/126) [`6e99226`](https://github.com/GLips/Figma-Context-MCP/commit/6e9922693dcff70b69be6b505e24062a89e821f0) Thanks [@habakan](https://github.com/habakan)! - Add SVG export options to control text outlining, id inclusion, and whether strokes should be simplified.

### Patch Changes

- [#153](https://github.com/GLips/Figma-Context-MCP/pull/153) [`4d58e83`](https://github.com/GLips/Figma-Context-MCP/commit/4d58e83d2e56e2bc1a4799475f29ffe2a18d6868) Thanks [@miraclehen](https://github.com/miraclehen)! - Refactor layout positioning logic and add pixel rounding.

- [#112](https://github.com/GLips/Figma-Context-MCP/pull/112) [`c48b802`](https://github.com/GLips/Figma-Context-MCP/commit/c48b802ff653cfc46fe6077a8dc96bd4a15edb40) Thanks [@dgxyzw](https://github.com/dgxyzw)! - Change format of component properties in simplified response.

- [#150](https://github.com/GLips/Figma-Context-MCP/pull/150) [`4a4318f`](https://github.com/GLips/Figma-Context-MCP/commit/4a4318faa6c2eb91a08e6cc2e41e3f9e2f499a41) Thanks [@GLips](https://github.com/GLips)! - Add curl fallback to make API requests more robust in corporate environments

- [#149](https://github.com/GLips/Figma-Context-MCP/pull/149) [`46550f9`](https://github.com/GLips/Figma-Context-MCP/commit/46550f91340969cf3683f4537aefc87d807f1b64) Thanks [@miraclehen](https://github.com/miraclehen)! - Resolve promise in image downloading function only after file is finished writing.

## 0.3.1

### Patch Changes

- [#133](https://github.com/GLips/Figma-Context-MCP/pull/133) [`983375d`](https://github.com/GLips/Figma-Context-MCP/commit/983375d3fe7f2c4b48ce770b13e5b8cb06b162d0) Thanks [@dgomez-orangeloops](https://github.com/dgomez-orangeloops)! - Auto-update package version in code.

## 0.3.0

### Minor Changes

- [#122](https://github.com/GLips/Figma-Context-MCP/pull/122) [`60c663e`](https://github.com/GLips/Figma-Context-MCP/commit/60c663e6a83886b03eb2cde7c60433439e2cedd0) Thanks [@YossiSaadi](https://github.com/YossiSaadi)! - Include component and component set names to help LLMs find pre-existing components in code

- [#109](https://github.com/GLips/Figma-Context-MCP/pull/109) [`64a1b10`](https://github.com/GLips/Figma-Context-MCP/commit/64a1b10fb62e4ccb5d456d4701ab1fac82084af3) Thanks [@jonmabe](https://github.com/jonmabe)! - Add OAuth token support using Authorization Bearer method for alternate Figma auth.

- [#128](https://github.com/GLips/Figma-Context-MCP/pull/128) [`3761a70`](https://github.com/GLips/Figma-Context-MCP/commit/3761a70db57b3f038335a5fb568c2ca5ff45ad21) Thanks [@miraclehen](https://github.com/miraclehen)! - Handle size calculations for non-AutoLayout elements and absolutely positioned elements.

### Patch Changes

- [#106](https://github.com/GLips/Figma-Context-MCP/pull/106) [`4237a53`](https://github.com/GLips/Figma-Context-MCP/commit/4237a5363f696dcf7abe046940180b6861bdcf22) Thanks [@saharis9988](https://github.com/saharis9988)! - Remove empty keys from simplified design output.

- [#119](https://github.com/GLips/Figma-Context-MCP/pull/119) [`d69d96f`](https://github.com/GLips/Figma-Context-MCP/commit/d69d96fd8a99c9b59111d9c89613a74c1ac7aa7d) Thanks [@cooliceman](https://github.com/cooliceman)! - Add scale support for PNG images pulled via download_figma_images tool.

- [#129](https://github.com/GLips/Figma-Context-MCP/pull/129) [`56f968c`](https://github.com/GLips/Figma-Context-MCP/commit/56f968cd944cbf3058f71f3285c363e895dcf91d) Thanks [@fightZy](https://github.com/fightZy)! - Make shadows on text nodes apply text-shadow rather than box-shadow

## 0.2.2

### Patch Changes

- fd10a46: - Update HTTP server creation method to no longer subclass McpServer
  - Change logging behavior on HTTP server
- 6e2c8f5: Minor bump, testing fix for hanging CF DOs

## 0.2.2-beta.1

### Patch Changes

- 6e2c8f5: Minor bump, testing fix for hanging CF DOs

## 0.2.2-beta.0

### Patch Changes

- fd10a46: - Update HTTP server creation method to no longer subclass McpServer
  - Change logging behavior on HTTP server
