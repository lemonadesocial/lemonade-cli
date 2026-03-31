# Changelog

## [1.1.0](https://github.com/lemonadesocial/lemonade-cli/compare/v1.0.8...v1.1.0) (2026-03-31)


### Features

* add rich rendering - markdown, streaming, thinking indicator (Phase B) ([74818dd](https://github.com/lemonadesocial/lemonade-cli/commit/74818dd6240e57bb74b81392aa0b640bd8413e81))
* add rich terminal UI for make-lemonade (Phase A - ESM, ChatEngine, Ink foundation) ([27ad63b](https://github.com/lemonadesocial/lemonade-cli/commit/27ad63b0e13f66137cae4753fb137b5a988157e7))
* add tool execution, slash commands, error display, confirm prompt (Phase C) ([3f83884](https://github.com/lemonadesocial/lemonade-cli/commit/3f8388490851657041c00a45f46ddb4d14c60631))

## [1.0.8](https://github.com/lemonadesocial/lemonade-cli/compare/v1.0.7...v1.0.8) (2026-03-31)


### Bug Fixes

* update aiGetMe query to match new AIGetMeResponse schema ([9de7741](https://github.com/lemonadesocial/lemonade-cli/commit/9de774114ceef8693f5a1477389ac8e2589643f9))

## [1.0.7](https://github.com/lemonadesocial/lemonade-cli/compare/v1.0.6...v1.0.7) (2026-03-31)


### Bug Fixes

* read version from package.json instead of hardcoded value ([c0773e3](https://github.com/lemonadesocial/lemonade-cli/commit/c0773e3f81938c0a95b5391a951275039f40c081))
* use import instead of require for package.json ([6bfd469](https://github.com/lemonadesocial/lemonade-cli/commit/6bfd469eb0e3d4742652882a03ce870f5e76f918))

## [1.0.6](https://github.com/lemonadesocial/lemonade-cli/compare/v1.0.5...v1.0.6) (2026-03-31)


### Bug Fixes

* trigger release ([a1ed29f](https://github.com/lemonadesocial/lemonade-cli/commit/a1ed29fcd25758484d63d51a949955ed54fbdaf1))

## [1.0.5](https://github.com/lemonadesocial/lemonade-cli/compare/v1.0.4...v1.0.5) (2026-03-31)


### Bug Fixes

* trigger release ([5806966](https://github.com/lemonadesocial/lemonade-cli/commit/58069669f5e4efbbc758a468a32f16980ed9b385))

## [1.0.4](https://github.com/lemonadesocial/lemonade-cli/compare/v1.0.3...v1.0.4) (2026-03-31)


### Bug Fixes

* trigger release ([de430d5](https://github.com/lemonadesocial/lemonade-cli/commit/de430d5cc8bbc3e753106e1341686d0e1cb2968e))

## [1.0.3](https://github.com/lemonadesocial/lemonade-cli/compare/v1.0.2...v1.0.3) (2026-03-31)


### Bug Fixes

* revert package name to @lemonade-social/cli ([9f20cd8](https://github.com/lemonadesocial/lemonade-cli/commit/9f20cd8946bc5c354a01b75d1d14688ac43c7dee))

## [1.0.2](https://github.com/lemonadesocial/lemonade-cli/compare/v1.0.1...v1.0.2) (2026-03-31)


### Bug Fixes

* add NPM_TOKEN for publish authentication ([7260f3e](https://github.com/lemonadesocial/lemonade-cli/commit/7260f3e29815dc47414cc0063da663dc63bf84e9))

## [1.0.1](https://github.com/lemonadesocial/lemonade-cli/compare/v1.0.0...v1.0.1) (2026-03-31)


### Bug Fixes

* use unscoped package name for npm publish ([6d2fd81](https://github.com/lemonadesocial/lemonade-cli/commit/6d2fd8148b84b6e0f72ee0ae5fce10ef90028f01))

## 1.0.0 (2026-03-31)


### Features

* add cli with all 44 commands, auth, api clients, output formatting ([4ea8e5b](https://github.com/lemonadesocial/lemonade-cli/commit/4ea8e5b5058a283c3fcfe8813f52a3f009446fa3))
* add codegen auto-sync pipeline for mcp and graphql ([abd7f2c](https://github.com/lemonadesocial/lemonade-cli/commit/abd7f2c2bb430fc0ebd595eae46d4a31e4a93cbe))
* add make-lemonade interactive AI terminal and stripe commands ([bb4161f](https://github.com/lemonadesocial/lemonade-cli/commit/bb4161f856a593c919270360f23d02182631b62e))
* add space switch tool for make-lemonade ([e626e20](https://github.com/lemonadesocial/lemonade-cli/commit/e626e205acb081cc8e3f4492732d02cecf6f7265))
* add stripe-connect and stripe-status commands ([e2dedfa](https://github.com/lemonadesocial/lemonade-cli/commit/e2dedfa6096bc087fe8e1e1899e0735a739e1a02))
* point OAuth2 login at Hydra public URL instead of backend ([a1437de](https://github.com/lemonadesocial/lemonade-cli/commit/a1437de100340172feac8a299a977e364f5d8e07))
* pump version to 1.0.0 ([d238316](https://github.com/lemonadesocial/lemonade-cli/commit/d2383166cd6ed274f6648c8ae2c737e7088bce9a))


### Bug Fixes

* show actual API error instead of generic "Invalid key" message ([7f5e36f](https://github.com/lemonadesocial/lemonade-cli/commit/7f5e36f577b9d376a68a9937dd9494d846b25b31))
* switch to eslint 9 flat config, remove unused import ([5a0f093](https://github.com/lemonadesocial/lemonade-cli/commit/5a0f093abbfd7c25b7866be336021e5f766783b7))
* update npm scope to [@lemonade](https://github.com/lemonade)_social/cli ([e722101](https://github.com/lemonadesocial/lemonade-cli/commit/e722101d3d1c7fdd2e04def28af6e7421d0b856b))
* update npm scope to @lemonade-social/cli ([b5e65c6](https://github.com/lemonadesocial/lemonade-cli/commit/b5e65c6d87f3a4e1478bced4e7cf5e5e9b8b4561))
