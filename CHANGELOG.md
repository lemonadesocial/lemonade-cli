# Changelog

## Unreleased

* align connector_disconnect with DisconnectResult contract; token-revocation failures are now surfaced instead of silently succeeding

## [1.5.0](https://github.com/lemonadesocial/lemonade-cli/compare/v1.4.1...v1.5.0) (2026-04-20)


### Features

* **notifications:** add filters TUI command ([7f24e48](https://github.com/lemonadesocial/lemonade-cli/commit/7f24e484dc98ddf3609fd30de8ebe3f7e5274602))
* **notifications:** add preferences TUI command ([7a112f0](https://github.com/lemonadesocial/lemonade-cli/commit/7a112f02a1f0405238210879dcfeb76f372e5705))
* **notifications:** add schema codegen drift guardrails ([16b4be3](https://github.com/lemonadesocial/lemonade-cli/commit/16b4be3799ef06a6667dd89c76d8526809474a0c))
* **notifications:** add watch, list, and read commands ([1b269a3](https://github.com/lemonadesocial/lemonade-cli/commit/1b269a3e9c6a02beb45b66169cd0cfe8e59f4769))
* **notifications:** persist last-seen dedup across sessions ([1089a43](https://github.com/lemonadesocial/lemonade-cli/commit/1089a4311205f9b25282d06529cf92d2f2d58b0f))


### Bug Fixes

* **cli:** rewrite 3 tickets/payment resolvers + fix credits_usage scalar ([#219](https://github.com/lemonadesocial/lemonade-cli/issues/219)) ([830d924](https://github.com/lemonadesocial/lemonade-cli/commit/830d924bccfbc785c1100e17729be4986dec38da))
* **cli:** rewrite 4 space-domain resolvers + surface space_connectors ([#218](https://github.com/lemonadesocial/lemonade-cli/issues/218)) ([4e84826](https://github.com/lemonadesocial/lemonade-cli/commit/4e84826ceb4346be9f75065f335bec27ac1557ec))
* **cli:** rewrite 6 event-analytics resolvers (drift sweep, final) ([#220](https://github.com/lemonadesocial/lemonade-cli/issues/220)) ([118940e](https://github.com/lemonadesocial/lemonade-cli/commit/118940ec22ad3dffb437c8a913d1d5e81f92df82))
* **cli:** rewrite page-preview-link tool for createPreviewLink resolver ([#216](https://github.com/lemonadesocial/lemonade-cli/issues/216)) ([0145466](https://github.com/lemonadesocial/lemonade-cli/commit/01454661fdbed830142d97fd03beef8948b8cf08))
* **notifications:** address audit finding A-101 (test fs race) ([1784f9d](https://github.com/lemonadesocial/lemonade-cli/commit/1784f9d578e8b1c7979e81688e7875eb941ca60c))
* **notifications:** address audit findings A-001 / A-002 / A-003 ([dad4c2d](https://github.com/lemonadesocial/lemonade-cli/commit/dad4c2d202e027bd60369afea115928888cb092d))
* **notifications:** address audit findings A-001..A-005 ([409d5ed](https://github.com/lemonadesocial/lemonade-cli/commit/409d5ed631cf6a63b029e8fa833d1e04773cca26))
* **notifications:** address audit findings A-001..A-012 ([841c82a](https://github.com/lemonadesocial/lemonade-cli/commit/841c82ae2af3e8aef7541db7334bc966cf11c1bd))

## [1.4.1](https://github.com/lemonadesocial/lemonade-cli/compare/v1.4.0...v1.4.1) (2026-04-19)


### Bug Fixes

* **cli:** remove expires_at field from stripe-connect mutation ([#186](https://github.com/lemonadesocial/lemonade-cli/issues/186)) ([8a0402a](https://github.com/lemonadesocial/lemonade-cli/commit/8a0402aaeac3e7bb961ef0e0b4b1b792d8fdb72d))

## [1.4.0](https://github.com/lemonadesocial/lemonade-cli/compare/v1.3.0...v1.4.0) (2026-04-19)


### Features

* add CLI tools for notification filters and channel preferences ([#205](https://github.com/lemonadesocial/lemonade-cli/issues/205)) ([63a013e](https://github.com/lemonadesocial/lemonade-cli/commit/63a013e930fd55f1035d9bcda89914bc33d7e72f))
* add sessions command group with MCP client tagging ([#207](https://github.com/lemonadesocial/lemonade-cli/issues/207)) ([38fa6f1](https://github.com/lemonadesocial/lemonade-cli/commit/38fa6f135bc27f22a8ae3e461cd777764da154e8))
* **cli:** handle WS close codes 4401/4403 and send X-Client-Type on connection_init ([#211](https://github.com/lemonadesocial/lemonade-cli/issues/211)) ([69e131e](https://github.com/lemonadesocial/lemonade-cli/commit/69e131e0906909b3735138fd12708633c6ca1a32))
* **cli:** ordered auth logout with 2s revoke timeout and WS dispose ([#212](https://github.com/lemonadesocial/lemonade-cli/issues/212)) ([b5db7f1](https://github.com/lemonadesocial/lemonade-cli/commit/b5db7f1b8dcd0ed9f43c075d75b258b24566db84))


### Bug Fixes

* **cli:** auth logout calls revokeCurrentSession ([#208](https://github.com/lemonadesocial/lemonade-cli/issues/208)) ([66c571c](https://github.com/lemonadesocial/lemonade-cli/commit/66c571c5f56423bea2341599a5cc2e643766e847))
* **connector:** align disconnectPlatform consumer with DisconnectResult ([#210](https://github.com/lemonadesocial/lemonade-cli/issues/210)) ([09a0fd9](https://github.com/lemonadesocial/lemonade-cli/commit/09a0fd92a6afdf86ab36cdfa10128941e691e502))

## [1.3.0](https://github.com/lemonadesocial/lemonade-cli/compare/v1.2.2...v1.3.0) (2026-04-09)


### Features

* add centralized execution context for space and event state ([#192](https://github.com/lemonadesocial/lemonade-cli/issues/192)) ([9cb96e4](https://github.com/lemonadesocial/lemonade-cli/commit/9cb96e490115511466c0c955079439c796098e40))
* add client-side validation for timezone, currency, and dates ([#194](https://github.com/lemonadesocial/lemonade-cli/issues/194)) ([1db4158](https://github.com/lemonadesocial/lemonade-cli/commit/1db41584688e13054b1e7212314521ff7b321572))
* add declarative session updates for capabilities ([#195](https://github.com/lemonadesocial/lemonade-cli/issues/195)) ([4ab7088](https://github.com/lemonadesocial/lemonade-cli/commit/4ab7088ee5121629b363f04027cd78f36d9c40bc))
* add dry-run mode for mutation tool preview ([#197](https://github.com/lemonadesocial/lemonade-cli/issues/197)) ([2ee0051](https://github.com/lemonadesocial/lemonade-cli/commit/2ee0051cee536eee058407fd2df845aabdf55efc))
* add MCP server mode for Claude Code integration ([#189](https://github.com/lemonadesocial/lemonade-cli/issues/189)) ([3425518](https://github.com/lemonadesocial/lemonade-cli/commit/342551852d9b4f4db7edbc38adc26fd8b7476b31))
* add real-time notification listener with WebSocket and polling fallback ([#204](https://github.com/lemonadesocial/lemonade-cli/issues/204)) ([fc5516f](https://github.com/lemonadesocial/lemonade-cli/commit/fc5516f6b834827d2a3572584912432ac57483d4))
* add workflow system for multi-step tool orchestration ([#198](https://github.com/lemonadesocial/lemonade-cli/issues/198)) ([6ff3e92](https://github.com/lemonadesocial/lemonade-cli/commit/6ff3e92fc5a5ee231ae2208c6edd8c34ffb07452))
* auto-generate CLI commands from CanonicalCapability definitions ([#191](https://github.com/lemonadesocial/lemonade-cli/issues/191)) ([19caadb](https://github.com/lemonadesocial/lemonade-cli/commit/19caadb0ccb221023feb3c50ce53797c847ce4c1))
* consolidate tools and re-categorize defer flags ([#199](https://github.com/lemonadesocial/lemonade-cli/issues/199)) ([c608f62](https://github.com/lemonadesocial/lemonade-cli/commit/c608f628074cd9c36401c8e47d0f00a6558d068d))
* filter capabilities by aiTool surface in registry and partitioner ([#193](https://github.com/lemonadesocial/lemonade-cli/issues/193)) ([4cd03fd](https://github.com/lemonadesocial/lemonade-cli/commit/4cd03fd153c623b931e055b497fded8a9e7e5cf0))
* parallelize independent query tool execution ([#190](https://github.com/lemonadesocial/lemonade-cli/issues/190)) ([c4a87d2](https://github.com/lemonadesocial/lemonade-cli/commit/c4a87d276883399991375f7c1c048f640df54631))
* preserve key context during conversation history truncation ([#196](https://github.com/lemonadesocial/lemonade-cli/issues/196)) ([65abe54](https://github.com/lemonadesocial/lemonade-cli/commit/65abe54175816d80be72687408441ed802fa6266))


### Bug Fixes

* remove internal docs from repo and add to gitignore ([#187](https://github.com/lemonadesocial/lemonade-cli/issues/187)) ([74e9f07](https://github.com/lemonadesocial/lemonade-cli/commit/74e9f070a8a9b6184fe5f91e71db38ff5166d333))

## 1.0.0 (2026-04-08)


### Features

* add /btw command for parallel side questions with turn isolation ([#70](https://github.com/lemonadesocial/lemonade-cli/issues/70)) ([b6b7a27](https://github.com/lemonadesocial/lemonade-cli/commit/b6b7a27b6dc2df69e450d6af9ef96407a70ba799))
* add /status, /events, /spaces, /credits, /history commands ([#78](https://github.com/lemonadesocial/lemonade-cli/issues/78)) ([860b08d](https://github.com/lemonadesocial/lemonade-cli/commit/860b08d8e9eb69fb68133e0466d236584a105008))
* add /version command with npm update check and restart ([#71](https://github.com/lemonadesocial/lemonade-cli/issues/71)) ([a8573e8](https://github.com/lemonadesocial/lemonade-cli/commit/a8573e83b745a1b02e9cc5483e35f247f00e9ab9))
* add 10 event admin tools (clone, recurring, checkin, export, invitations, tickets, payments) ([#81](https://github.com/lemonadesocial/lemonade-cli/issues/81)) ([609b725](https://github.com/lemonadesocial/lemonade-cli/commit/609b72586930bfe3f2037420e92a0cf2c7fc64d1))
* add 31 new tools, AI credits, subscriptions, and billing safety dual-mode ([8604303](https://github.com/lemonadesocial/lemonade-cli/commit/86043031224f20a4ea021b0676d6eb8c46039635))
* add 34 new tools for events, co-hosts, broadcasting, email, guests, analytics, pages, templates ([ddb013d](https://github.com/lemonadesocial/lemonade-cli/commit/ddb013d52e5f304a8576a40c0d4146bfb5584920))
* add 7 connector tools, /connectors command, and connectors skill file ([#87](https://github.com/lemonadesocial/lemonade-cli/issues/87)) ([1d84e11](https://github.com/lemonadesocial/lemonade-cli/commit/1d84e1138c99fbe6afe9be79c579ca1f6bada0e4))
* add 8 space admin tools (analytics, leaderboards, roles, pinning, delete) ([#82](https://github.com/lemonadesocial/lemonade-cli/issues/82)) ([5a079b1](https://github.com/lemonadesocial/lemonade-cli/commit/5a079b1a779af84c26511c4fa0d94ce92ae66b14))
* add advanced analytics tools ([ea944f6](https://github.com/lemonadesocial/lemonade-cli/commit/ea944f6ea5ecd622b209f390b684ba1c262963eb))
* add auth logout command to clear stored credentials ([#150](https://github.com/lemonadesocial/lemonade-cli/issues/150)) ([4413bea](https://github.com/lemonadesocial/lemonade-cli/commit/4413bea687bee033d77fc8d5ee7bf30531e1a66e))
* add automated schema validation test for GraphQL field names ([#104](https://github.com/lemonadesocial/lemonade-cli/issues/104)) ([4d0da83](https://github.com/lemonadesocial/lemonade-cli/commit/4d0da83e96e794f1e2a556fcd6eefaf81e7959a0))
* add backend drift detection for capability resolver coverage ([5e90706](https://github.com/lemonadesocial/lemonade-cli/commit/5e90706ca80ba126d095f08e7aa2fa2186ac4a3a))
* add CanonicalCapability type infrastructure with factory and adapter ([70a6684](https://github.com/lemonadesocial/lemonade-cli/commit/70a6684cec3966ad2c88fc3eb281740d1ff3c01d))
* add capability manifest, introspection command, and skill generation ([411bf86](https://github.com/lemonadesocial/lemonade-cli/commit/411bf86af2cb373c29758ef761f55a6b973303c6))
* add cli with all 44 commands, auth, api clients, output formatting ([4ea8e5b](https://github.com/lemonadesocial/lemonade-cli/commit/4ea8e5b5058a283c3fcfe8813f52a3f009446fa3))
* add codegen auto-sync pipeline for mcp and graphql ([abd7f2c](https://github.com/lemonadesocial/lemonade-cli/commit/abd7f2c2bb430fc0ebd595eae46d4a31e4a93cbe))
* add core multiline input classes (Batch 1/3) ([#109](https://github.com/lemonadesocial/lemonade-cli/issues/109)) ([092eb40](https://github.com/lemonadesocial/lemonade-cli/commit/092eb4046d03ffdda76190372821b83de32478d7))
* add discoverability metadata (whenToUse, searchHint, shouldDefer, alwaysLoad) to all tools ([f772e8c](https://github.com/lemonadesocial/lemonade-cli/commit/f772e8cbfaf33587691efc573b0ef4a27e8ef7f0))
* add doctor command for CLI health diagnostics ([1515fb1](https://github.com/lemonadesocial/lemonade-cli/commit/1515fb1974154edcedd070e936cc1cf536cda503))
* add event session reservation and voting tools ([86307b6](https://github.com/lemonadesocial/lemonade-cli/commit/86307b6818bd8f0d0621231dc79df1457bef3553))
* add explicit category metadata to tool registry ([4ee3c04](https://github.com/lemonadesocial/lemonade-cli/commit/4ee3c04b314a25d7640d324407306cd2c4b477ed))
* add file upload pipeline and image management tools ([09cc0a3](https://github.com/lemonadesocial/lemonade-cli/commit/09cc0a3f024ec4b3e94d208869afbeadea46a91a))
* add make-lemonade interactive AI terminal and stripe commands ([bb4161f](https://github.com/lemonadesocial/lemonade-cli/commit/bb4161f856a593c919270360f23d02182631b62e))
* add MultilineInput React component (Batch 2/3) ([#110](https://github.com/lemonadesocial/lemonade-cli/issues/110)) ([4c2603f](https://github.com/lemonadesocial/lemonade-cli/commit/4c2603f6cb82940adb41ffd6d04fc18772497231))
* add OAuth polling, secure API key input, and connector run command ([#89](https://github.com/lemonadesocial/lemonade-cli/issues/89)) ([102e548](https://github.com/lemonadesocial/lemonade-cli/commit/102e548b14a8639ac02192b079ddde0dd6f6e031))
* add payment account CRUD and Stripe capability tools ([aa60958](https://github.com/lemonadesocial/lemonade-cli/commit/aa6095830030280e2c1aa23c1327f4dbaffd49ae))
* add plan mode wizard for interactive parameter collection ([#59](https://github.com/lemonadesocial/lemonade-cli/issues/59)) ([460e25d](https://github.com/lemonadesocial/lemonade-cli/commit/460e25db1b931fa2db1ba805f4ef57b98116faaf))
* add retry with exponential backoff for transient streaming errors ([98506e6](https://github.com/lemonadesocial/lemonade-cli/commit/98506e600df09b27c7e058334685d47420d0bbf1))
* add retry with exponential backoff for transient streaming errors ([162fa11](https://github.com/lemonadesocial/lemonade-cli/commit/162fa11e29feab1773e244bed6067eea81260d9f))
* add rich rendering - markdown, streaming, thinking indicator (Phase B) ([74818dd](https://github.com/lemonadesocial/lemonade-cli/commit/74818dd6240e57bb74b81392aa0b640bd8413e81))
* add rich terminal UI for make-lemonade (Phase A - ESM, ChatEngine, Ink foundation) ([27ad63b](https://github.com/lemonadesocial/lemonade-cli/commit/27ad63b0e13f66137cae4753fb137b5a988157e7))
* add space event moderation and quota tools ([a6ae666](https://github.com/lemonadesocial/lemonade-cli/commit/a6ae6664fdc32403cd4ce70dbb0a54101adb6bbf))
* add space newsletter operations tools ([6fa7529](https://github.com/lemonadesocial/lemonade-cli/commit/6fa7529a99643fde272c93d2e08dbbbd5eefcb4f))
* add space role permissions tools ([bd929a6](https://github.com/lemonadesocial/lemonade-cli/commit/bd929a6134a5a09f893dcaff605cd53c9b0e15dd))
* add space switch tool for make-lemonade ([e626e20](https://github.com/lemonadesocial/lemonade-cli/commit/e626e205acb081cc8e3f4492732d02cecf6f7265))
* add status command for at-a-glance CLI state overview ([eb77abb](https://github.com/lemonadesocial/lemonade-cli/commit/eb77abbdfe380b4be4703a19bf38ed9ee2e9fb1d))
* add stripe-connect and stripe-status commands ([e2dedfa](https://github.com/lemonadesocial/lemonade-cli/commit/e2dedfa6096bc087fe8e1e1899e0735a739e1a02))
* add Tempo auto-pay for tickets, payout setup, MPP request, and reward display ([#91](https://github.com/lemonadesocial/lemonade-cli/issues/91)) ([fe9a853](https://github.com/lemonadesocial/lemonade-cli/commit/fe9a85332e896fda246724a0da008867b650f7b9))
* add Tempo wallet integration with /tempo command and wallet tools ([#90](https://github.com/lemonadesocial/lemonade-cli/issues/90)) ([1b62d0e](https://github.com/lemonadesocial/lemonade-cli/commit/1b62d0e9ee10e6d97ae95fedbf63c331707de3ae))
* add theme data management and theme builder tool ([a632ef2](https://github.com/lemonadesocial/lemonade-cli/commit/a632ef2508aa7700ed2ccdd20c3f803fd8757aee))
* add ticket lifecycle and payment operations tools ([9f9fc48](https://github.com/lemonadesocial/lemonade-cli/commit/9f9fc48edee1560f463e120d663191e4c8f518a0))
* add tool discoverability via CLI commands and /tools slash command ([4015117](https://github.com/lemonadesocial/lemonade-cli/commit/40151179ad590b96f5d68aabeecdf797797f8d04))
* add tool execution, slash commands, error display, confirm prompt (Phase C) ([3f83884](https://github.com/lemonadesocial/lemonade-cli/commit/3f8388490851657041c00a45f46ddb4d14c60631))
* add user tools, discount management, ticket categories, and application export ([#83](https://github.com/lemonadesocial/lemonade-cli/issues/83)) ([2c92365](https://github.com/lemonadesocial/lemonade-cli/commit/2c92365519f85c19dec8427397f561e8a26da02b))
* add Zesty skills system with 6 domain skill files and /name command ([701c042](https://github.com/lemonadesocial/lemonade-cli/commit/701c0429dfa74d2419be20d0cc0785fa4df6c20f))
* enable Kitty keyboard protocol for Shift+Enter, add Ctrl+L and Ctrl+U ([#75](https://github.com/lemonadesocial/lemonade-cli/issues/75)) ([587f201](https://github.com/lemonadesocial/lemonade-cli/commit/587f20160a1aa92a8596258302a86a42fdcedc9e))
* enrich all tools with CanonicalCapability metadata ([351820f](https://github.com/lemonadesocial/lemonade-cli/commit/351820f1ccd62d1f416d327039fd9d8664c77068))
* expand event create/update to full EventInput configuration ([38e92c0](https://github.com/lemonadesocial/lemonade-cli/commit/38e92c0c795a31d39d938adf750649eb6982e8ce))
* expand space create/update to full SpaceInput and add payment accounts tool ([dd02c77](https://github.com/lemonadesocial/lemonade-cli/commit/dd02c77a230d74577553683fe1d36d23d92ccce8))
* implement deferred tool loading with ToolSearch ([61ce9e5](https://github.com/lemonadesocial/lemonade-cli/commit/61ce9e5079e7152802ec18c1137f4931c1e453d7))
* integrate MultilineInput, remove ink-text-input (Batch 3/3) ([#111](https://github.com/lemonadesocial/lemonade-cli/issues/111)) ([bf4ef9a](https://github.com/lemonadesocial/lemonade-cli/commit/bf4ef9a843d4b133ce33b4d30f10f369aad9d62c))
* point OAuth2 login at Hydra public URL instead of backend ([a1437de](https://github.com/lemonadesocial/lemonade-cli/commit/a1437de100340172feac8a299a977e364f5d8e07))
* polish toolbar, loading state, and spacing UX ([#57](https://github.com/lemonadesocial/lemonade-cli/issues/57)) ([c84b542](https://github.com/lemonadesocial/lemonade-cli/commit/c84b5428021845ba282ffa4a82860b862dde4a00))
* pump version to 1.0.0 ([d238316](https://github.com/lemonadesocial/lemonade-cli/commit/d2383166cd6ed274f6648c8ae2c737e7088bce9a))
* rebuild terminal UI with Ink fullscreen layout ([#53](https://github.com/lemonadesocial/lemonade-cli/issues/53)) ([42b6b70](https://github.com/lemonadesocial/lemonade-cli/commit/42b6b7049c89f92ed8e4a536ad36edeaf4d002e3))
* rebuild terminal UI with readline + chalk ([#52](https://github.com/lemonadesocial/lemonade-cli/issues/52)) ([b6c19fa](https://github.com/lemonadesocial/lemonade-cli/commit/b6c19faf9166cde0c288d4364d33f44d6d479792))
* redesign plan mode wizard with progress bar, markdown renderer, and natural language trigger ([#62](https://github.com/lemonadesocial/lemonade-cli/issues/62)) ([378a05e](https://github.com/lemonadesocial/lemonade-cli/commit/378a05e4fb879e5bcb8e9f7cde28a4ea48c00f2b))
* skip second API call for self-describing tools via formatResult ([#74](https://github.com/lemonadesocial/lemonade-cli/issues/74)) ([907e7e0](https://github.com/lemonadesocial/lemonade-cli/commit/907e7e06a0520c7cb9965d78cb69e2338f244b3a))
* switch to standard event endpoints for timezone/space data, add /export CSV command ([#84](https://github.com/lemonadesocial/lemonade-cli/issues/84)) ([14d27c5](https://github.com/lemonadesocial/lemonade-cli/commit/14d27c5010340207329ccc9be9739f1161c6861b))


### Bug Fixes

* /credits help text mode qualifier + deduplicate displayName ternary ([18d1f53](https://github.com/lemonadesocial/lemonade-cli/commit/18d1f53f260ea0750f387e32b96537414de73de8))
* add chalk styling and credits guidance to API key error ([5244192](https://github.com/lemonadesocial/lemonade-cli/commit/52441922a0bab7a53b65aa2341be5fbb28ac84e2))
* add cli_version tool so AI handles version questions naturally ([#72](https://github.com/lemonadesocial/lemonade-cli/issues/72)) ([21d0a8c](https://github.com/lemonadesocial/lemonade-cli/commit/21d0a8caaecd9d002b93cc78e3e3c0f505b38dd8))
* add comment explaining post-exit return guard ([82be6f1](https://github.com/lemonadesocial/lemonade-cli/commit/82be6f10e96d902aaed762722ed88fc821523b0b))
* add executable bin wrappers for reliable CLI installation ([2ab0067](https://github.com/lemonadesocial/lemonade-cli/commit/2ab0067d275877ce22e014b23db9fce079acc580))
* add input separator line and status bar ([b28d9dc](https://github.com/lemonadesocial/lemonade-cli/commit/b28d9dca089222206bc5db230548fabfee3d42f3))
* add invariant comment to Escape rollback path ([442b2e3](https://github.com/lemonadesocial/lemonade-cli/commit/442b2e3d96c77da1bbf7e1127b903b9b7c8f80f6))
* add missing branch files for live mode/provider switching ([688a86b](https://github.com/lemonadesocial/lemonade-cli/commit/688a86b15be1e6f43f0cd1ae3adf59bf8d7d404d))
* add missing capabilities to mock providers in conversationStore tests ([016384c](https://github.com/lemonadesocial/lemonade-cli/commit/016384c117080667240a1c4e0f51b888296ab108))
* add missing CapabilityNotAvailableError catch in connectors list ([67b127d](https://github.com/lemonadesocial/lemonade-cli/commit/67b127d3fc356919a5cf4fda7a87293fb5aaa9ad))
* add missing TOOL_TO_RESOLVER entries for ai-prefixed tools ([1ca10fd](https://github.com/lemonadesocial/lemonade-cli/commit/1ca10fdfe6ce7ab90ea19a6733ead0e5e6d6d862))
* add newsletter failed status and expand detail view ([5a5ce6c](https://github.com/lemonadesocial/lemonade-cli/commit/5a5ce6cc4b5613db9d56842620336c0d1861ac69))
* add NPM_TOKEN for publish authentication ([7260f3e](https://github.com/lemonadesocial/lemonade-cli/commit/7260f3e29815dc47414cc0063da663dc63bf84e9))
* add null guard for getEvent and fix argument nullability ([788e5e7](https://github.com/lemonadesocial/lemonade-cli/commit/788e5e7c1b56aa9fe4cdcbe52c46d5776f19ffbe))
* add timezone detection, ban markdown tables, add table fallback renderer ([#63](https://github.com/lemonadesocial/lemonade-cli/issues/63)) ([48d86f3](https://github.com/lemonadesocial/lemonade-cli/commit/48d86f3ffbf3640fcc145f06da2d7c6dd2e70d05))
* add troubleshooting hint for Tempo login redirect issue ([#101](https://github.com/lemonadesocial/lemonade-cli/issues/101)) ([13555b0](https://github.com/lemonadesocial/lemonade-cli/commit/13555b013d23525ffdeddfe2c2ff66a599e3fb92))
* add unhandledRejection and uncaughtException handlers for safe crash cleanup ([f85c4ed](https://github.com/lemonadesocial/lemonade-cli/commit/f85c4ed8aa9aac826ab8c5afb4c188a36af540d5))
* address all hostile review findings on slash command routing ([1b353a6](https://github.com/lemonadesocial/lemonade-cli/commit/1b353a696be39e30717196410f3958d8e0679d38))
* address all review findings for chat startup mode recovery ([677421f](https://github.com/lemonadesocial/lemonade-cli/commit/677421f7f9fd4a6ee85005f5fe8fe2ce7c39b38a))
* address all review findings for chat startup/mode-recovery ([85f2960](https://github.com/lemonadesocial/lemonade-cli/commit/85f29600caa1087899d2d71dd2d920670f4eca2e))
* address audit findings for advanced analytics tools ([26aef51](https://github.com/lemonadesocial/lemonade-cli/commit/26aef51e96bec3858857ad1be0d8dd9cede12063))
* address audit findings for backend drift detection ([74f25d0](https://github.com/lemonadesocial/lemonade-cli/commit/74f25d07f5520d5fd6e2c76b9d504b64c6ed8b69))
* address audit findings for capability enrichment ([bee64e7](https://github.com/lemonadesocial/lemonade-cli/commit/bee64e7088ca30f8581676d882f7a5d61175d4f5))
* address audit findings for capability manifest and introspection ([aabafdd](https://github.com/lemonadesocial/lemonade-cli/commit/aabafddb09a30915695fdc6c5ef53adcbdce74da))
* address audit findings for capability type infrastructure ([09ef066](https://github.com/lemonadesocial/lemonade-cli/commit/09ef066a321bfe4a9c23a714aa3aed7429d760f4))
* address audit findings for discoverability metadata ([8a083e5](https://github.com/lemonadesocial/lemonade-cli/commit/8a083e50cbe982190abf1ea21a7d8497c268d0df))
* address audit findings for event config completeness ([c3bd58e](https://github.com/lemonadesocial/lemonade-cli/commit/c3bd58eee33c6f39bf9c45c27346f3c5e67734e8))
* address audit findings for file upload pipeline ([50ffc73](https://github.com/lemonadesocial/lemonade-cli/commit/50ffc738c25c98368f3272deddcac0c2e26ca73c))
* address audit findings for newsletter tools ([2f0aa39](https://github.com/lemonadesocial/lemonade-cli/commit/2f0aa394ab2e3619458cbd95588a7e31443c2305))
* address audit findings for page builder tools ([0104e04](https://github.com/lemonadesocial/lemonade-cli/commit/0104e045777344d2bad9b6a1989a82a888dc02b2))
* address audit findings for payment account tools ([3ce70a9](https://github.com/lemonadesocial/lemonade-cli/commit/3ce70a9bc44af5dc104bf210af64b31cb4be8522))
* address audit findings for session and voting tools ([1ed9255](https://github.com/lemonadesocial/lemonade-cli/commit/1ed9255c7085c3052209ed78fdfc38cee3b98022))
* address audit findings for slash command unification ([060ad12](https://github.com/lemonadesocial/lemonade-cli/commit/060ad12df39a06fafd0acbb27c426c8a8933c7ac))
* address audit findings for space config completeness ([20ee8c6](https://github.com/lemonadesocial/lemonade-cli/commit/20ee8c6cec25e78cf2ac317bc81784166c4c884a))
* address audit findings for space event moderation tools ([8d36362](https://github.com/lemonadesocial/lemonade-cli/commit/8d3636204e922d9a808823a1f458b5a85587f9ee))
* address audit findings for theme data management ([456c845](https://github.com/lemonadesocial/lemonade-cli/commit/456c845af9fe38ca8d4bec83cbfc2c9924e046c4))
* address audit findings for ticket lifecycle tools ([8603691](https://github.com/lemonadesocial/lemonade-cli/commit/8603691500cadc8de4289fa624cea1d3a0605467))
* address audit findings for tool category metadata ([7274641](https://github.com/lemonadesocial/lemonade-cli/commit/7274641e1443fec36456183c6941d96e75fa5ad8))
* address critical audit findings for deferred tool loading ([ed4a285](https://github.com/lemonadesocial/lemonade-cli/commit/ed4a285cbe7772b46d9d6cbcfa6e9d73864b6a4d))
* address final review findings — dead guard, switch tests, state coupling ([63d366b](https://github.com/lemonadesocial/lemonade-cli/commit/63d366bfe50b38da27398c32565d388967471993))
* address hostile audit findings for streaming error recovery ([6c85473](https://github.com/lemonadesocial/lemonade-cli/commit/6c8547328d359c45216fdeaef12536375d2e6a03))
* address hostile review findings for /mode and help table ([8fd7b1b](https://github.com/lemonadesocial/lemonade-cli/commit/8fd7b1b24c36e773e6d9e812c1148e68f7679d23))
* address hostile review findings on credits-mode migration ([94e7117](https://github.com/lemonadesocial/lemonade-cli/commit/94e711743c2f3e22d556652da5a9ade408bf950b))
* address Karen PR [#117](https://github.com/lemonadesocial/lemonade-cli/issues/117) findings for terminal protocol cleanup ([25cfae0](https://github.com/lemonadesocial/lemonade-cli/commit/25cfae070aefdfbe401f53965bfee9aa54d66a90))
* address Karen review findings for analytics tools ([76d0584](https://github.com/lemonadesocial/lemonade-cli/commit/76d05846a4524e963f86bf383961bd946bfa0adb))
* address Karen review findings for capability enrichment ([2b1eff4](https://github.com/lemonadesocial/lemonade-cli/commit/2b1eff4ddebe88325808f5f2e3807a17a5baec49))
* address Karen review findings for capability infrastructure ([cb44f0a](https://github.com/lemonadesocial/lemonade-cli/commit/cb44f0a11c20fe4afedea4a6c569991df1ec767d))
* address Karen review findings for capability manifest ([f0fd83c](https://github.com/lemonadesocial/lemonade-cli/commit/f0fd83c982499122981e97df80303a0c6a86d9fc))
* address Karen review findings for deferred tool loading ([e75fda2](https://github.com/lemonadesocial/lemonade-cli/commit/e75fda2bc0891d47d022c656815289d058d4714b))
* address Karen review findings for discoverability metadata ([edfdb42](https://github.com/lemonadesocial/lemonade-cli/commit/edfdb421e78b3cf41bba1461124671c9e8e147ee))
* address Karen review findings for drift detection ([24b0b9a](https://github.com/lemonadesocial/lemonade-cli/commit/24b0b9ae2b084aa3f73113763e93cc593f07ebda))
* address Karen review findings for file upload pipeline ([f7df795](https://github.com/lemonadesocial/lemonade-cli/commit/f7df795af4ca03c31861f6f49c045e6e3ef9a55a))
* address Karen review findings for newsletter tools ([f03f0e2](https://github.com/lemonadesocial/lemonade-cli/commit/f03f0e2fbe3b023c9ed221215c6d7b995c63cb07))
* address Karen review findings for page builder tools ([41af378](https://github.com/lemonadesocial/lemonade-cli/commit/41af378cf2c9a55ed64a6380a7a1b6e8803f2c70))
* address Karen review findings for payment account tools ([7495e61](https://github.com/lemonadesocial/lemonade-cli/commit/7495e616cefd907f21135c9dae20776141f9e732))
* address Karen review findings for session and voting tools ([188b19e](https://github.com/lemonadesocial/lemonade-cli/commit/188b19ebc0be7720619c879434706239f07c2f37))
* address Karen review findings for slash command unification ([0efc855](https://github.com/lemonadesocial/lemonade-cli/commit/0efc8551f4280ea823918402414213b6bf1c8b0b))
* address Karen review findings for space config ([76dd99a](https://github.com/lemonadesocial/lemonade-cli/commit/76dd99ac5a5b29cc800a966b60d26ed8811b194e))
* address Karen review findings for streaming error recovery ([038d7c2](https://github.com/lemonadesocial/lemonade-cli/commit/038d7c2f31b09abac2faf26d6e489e0750845055))
* address Karen review findings for theme tools ([b5bcc10](https://github.com/lemonadesocial/lemonade-cli/commit/b5bcc100aef1e50d681eb37903e37c9d3bbe7d2d))
* address Karen review findings for ticket lifecycle tools ([95bd822](https://github.com/lemonadesocial/lemonade-cli/commit/95bd8222004283dc97243913287cd5687665e99a))
* address Karen review findings for tool category metadata ([1e85d72](https://github.com/lemonadesocial/lemonade-cli/commit/1e85d720ca01447a460f177d50069948e489e76c))
* address Karen review findings on build-release-hygiene ([cb875e9](https://github.com/lemonadesocial/lemonade-cli/commit/cb875e92f880ab3d21604eb5d3f8a6d5abb19fc5))
* address Karen review findings on credits history alignment ([3c1e632](https://github.com/lemonadesocial/lemonade-cli/commit/3c1e632a59473dcd9bffdad2aadb3ec310181c68))
* address Karen review findings on credits-history-alignment ([c759db2](https://github.com/lemonadesocial/lemonade-cli/commit/c759db2a528d53e713c4d4f1e82f60c5287b64b1))
* address remaining audit findings for remediation branch ([a5d36fc](https://github.com/lemonadesocial/lemonade-cli/commit/a5d36fc7bf1c8172e3d1fc20474342d40e3d1407))
* address remaining Karen review findings ([60a6dcc](https://github.com/lemonadesocial/lemonade-cli/commit/60a6dcc11168760a617496c5c673c2c10bf8d0cf))
* address remaining review findings for chat startup mode recovery ([e5b88a8](https://github.com/lemonadesocial/lemonade-cli/commit/e5b88a84ba17248483d30f182a7112a5ec3bdb2d))
* address retroactive Karen findings for event moderation and role permissions ([e66415e](https://github.com/lemonadesocial/lemonade-cli/commit/e66415eec97edeb468cfd8d3e0850fe1505b2087))
* address review findings — dead imports, vi import, abort signal fallback ([697554c](https://github.com/lemonadesocial/lemonade-cli/commit/697554c3199c491f1daaa5351c5971dd5885abf2))
* address review findings for MeasuredText display-column handling ([e05be21](https://github.com/lemonadesocial/lemonade-cli/commit/e05be211be3963c71641bba1e5c143afeb37d322))
* address review findings in verify-dist bin validation ([aa7a899](https://github.com/lemonadesocial/lemonade-cli/commit/aa7a899de8e9013e91b8dcde1a9c7ca6557db1a8))
* align batch mode JSON output with standard CLI envelope ([101b6bb](https://github.com/lemonadesocial/lemonade-cli/commit/101b6bb7265d156b8985ea11433b0b88d5a0400b))
* align chat tool registry with current event schema ([d451abb](https://github.com/lemonadesocial/lemonade-cli/commit/d451abbcd3b761033e6747b2cfbd96081b465589))
* align event and ticket GraphQL queries with current backend schema ([d36a08c](https://github.com/lemonadesocial/lemonade-cli/commit/d36a08c782aaf62380346443a24d47e5c2a5eeae))
* align event and ticket GraphQL queries with current backend schema ([#132](https://github.com/lemonadesocial/lemonade-cli/issues/132)) ([d36a08c](https://github.com/lemonadesocial/lemonade-cli/commit/d36a08c782aaf62380346443a24d47e5c2a5eeae))
* align event queries with current backend schema ([e9452ce](https://github.com/lemonadesocial/lemonade-cli/commit/e9452cecda7c1caa43a22512620d734a34393827))
* align feedback and ticket pricing queries with backend schema ([a20e555](https://github.com/lemonadesocial/lemonade-cli/commit/a20e555ba418c854172f6fc096c2f3ccc30ad864))
* align welcome banner to top of screen ([#55](https://github.com/lemonadesocial/lemonade-cli/issues/55)) ([314636d](https://github.com/lemonadesocial/lemonade-cli/commit/314636d0b8ff04b2096d7bb2530da55ff24cb9a1))
* await full multi-step Tempo login process with 5min timeout ([#100](https://github.com/lemonadesocial/lemonade-cli/issues/100)) ([404d987](https://github.com/lemonadesocial/lemonade-cli/commit/404d98762a5f48bf163fff145a5ac501b98a1ff6))
* backspace on empty line merges back into previous line in multiline input ([#108](https://github.com/lemonadesocial/lemonade-cli/issues/108)) ([6fcce45](https://github.com/lemonadesocial/lemonade-cli/commit/6fcce45671637be7599036327ea7584ac18d670b))
* bold event names, timezone-aware dates, community name in event lists ([#65](https://github.com/lemonadesocial/lemonade-cli/issues/65)) ([4fe2991](https://github.com/lemonadesocial/lemonade-cli/commit/4fe29917d1d8642a05af8a1c530cbc69710d494d))
* cache space list for consistent /spaces switching, reset streaming state on cancel ([#86](https://github.com/lemonadesocial/lemonade-cli/issues/86)) ([d1d48de](https://github.com/lemonadesocial/lemonade-cli/commit/d1d48de5d23feca0c8ff14d2916dc3167ee3d876))
* catch resolveSpaceTitle throw and stabilize spaceName fallback ([8e7771b](https://github.com/lemonadesocial/lemonade-cli/commit/8e7771bafa9a957c6de6e0215442092b8b9e8bcc))
* check abort signal after settling gate to prevent cancelled turn from reaching provider ([2b25b06](https://github.com/lemonadesocial/lemonade-cli/commit/2b25b06ef12a625b1dfdddb7db3d4be270034160))
* clean up final schema alignment doc and price edge cases ([482ed22](https://github.com/lemonadesocial/lemonade-cli/commit/482ed226708ef8ea2acbf7462c09c2a127a1ffaf))
* clean up final schema alignment review nits ([2e1ee75](https://github.com/lemonadesocial/lemonade-cli/commit/2e1ee7541f545826da96604f4318b6e84ede48ea))
* clear stale space name on BYOK switch and harden startup recovery ([245ad6e](https://github.com/lemonadesocial/lemonade-cli/commit/245ad6e30c96ca39e9af47a8d07e0eec619d1cc8))
* close refresh race and clean up auth refresh tests ([22c3fa6](https://github.com/lemonadesocial/lemonade-cli/commit/22c3fa696c4003f988d19e91b1b9f14215521408))
* comprehensive skills audit — formatting, response guidance, date handling ([#67](https://github.com/lemonadesocial/lemonade-cli/issues/67)) ([711faac](https://github.com/lemonadesocial/lemonade-cli/commit/711faac8c6752e4d2c799cdc20dbabde62612ff9))
* correct 6 schema mismatches and add /spaces switching ([#80](https://github.com/lemonadesocial/lemonade-cli/issues/80)) ([a1e32ee](https://github.com/lemonadesocial/lemonade-cli/commit/a1e32ee229918aacb03a8d9e0ca83f1c9babce38))
* correct dynamic schema injection guard for deferred tools ([af3c8d7](https://github.com/lemonadesocial/lemonade-cli/commit/af3c8d77310a3f9b71a76e5a7c534ce5072dce16))
* correct field names for guest stats, ticket sales, and view insight queries ([#103](https://github.com/lemonadesocial/lemonade-cli/issues/103)) ([143648a](https://github.com/lemonadesocial/lemonade-cli/commit/143648ad1a6a2e3a48c202d4642ccb1bc4ead01e))
* correct getMe query to match direct resolver response shape ([019bd92](https://github.com/lemonadesocial/lemonade-cli/commit/019bd92e5968ace32de7dcb3cb5010767e2818d1))
* correct masked display and cursorChar width tracking for surrogate pairs ([869f5b0](https://github.com/lemonadesocial/lemonade-cli/commit/869f5b062f1b10ac06c7917631441189c37fa3a6))
* correct notifications and space_stats queries, show spinner between tool iterations ([#79](https://github.com/lemonadesocial/lemonade-cli/issues/79)) ([38fac6b](https://github.com/lemonadesocial/lemonade-cli/commit/38fac6bc80a6837cc13b5488f42d9466e6e588e3))
* correct resolver mapping for page_section_catalog and add site_templates ([ec972c3](https://github.com/lemonadesocial/lemonade-cli/commit/ec972c35363bbc7845bd6c19b6bdb5d704f61e50))
* defensively clone caller-provided surfaces array ([c0402ed](https://github.com/lemonadesocial/lemonade-cli/commit/c0402ed7142612eff1b8b5f46b253a732a272a87))
* document ticket type id limitation and align free-ticket creation ([df0eacd](https://github.com/lemonadesocial/lemonade-cli/commit/df0eacdbfe81f5c3bc9ac5fe14217cf395d71477))
* document verify-dist regex coupling to bin wrapper structure ([181d7d8](https://github.com/lemonadesocial/lemonade-cli/commit/181d7d82f20fd00b7001e84a03d7c6cc1e938cdc))
* eliminate leading newline when truncation drops all history ([03794b4](https://github.com/lemonadesocial/lemonade-cli/commit/03794b43faaa2daf67c9f636dc135e05e5ebd5f4))
* eliminate render-phase ref side effects in useChatEngine index bookkeeping ([419be07](https://github.com/lemonadesocial/lemonade-cli/commit/419be07abeb67e1f47c893c2085abfd2af24fd0f))
* eliminate stale settling promise trap and add missing cancel tests ([31a1444](https://github.com/lemonadesocial/lemonade-cli/commit/31a14443f8fe2c8ade0209cc57d1d35c45a944b8))
* eliminate stale-snapshot replacement and updater timing dependency in removeMessageById ([205cad7](https://github.com/lemonadesocial/lemonade-cli/commit/205cad73dfae485cbb96e7a0f87528b2d3c865ae))
* emit JSON error envelope in batch mode on handleTurn failure ([51820ad](https://github.com/lemonadesocial/lemonade-cli/commit/51820adcb8caed2312606143d7567406f6a2650c))
* emit turn_done on all early return paths to prevent infinite spinner ([#73](https://github.com/lemonadesocial/lemonade-cli/issues/73)) ([bcd67e0](https://github.com/lemonadesocial/lemonade-cli/commit/bcd67e03e223f550b8977c2cc2a77191e2fab102))
* emit turn_done only after final iteration, guard empty messages, color status words ([#68](https://github.com/lemonadesocial/lemonade-cli/issues/68)) ([119d100](https://github.com/lemonadesocial/lemonade-cli/commit/119d100673fffc23a120822c58f2cd0f5a0660f8))
* enable selection highlighting in masked input mode ([608a1af](https://github.com/lemonadesocial/lemonade-cli/commit/608a1af9e5319f3c5f8f7850188742ed7c5036d5))
* enforce mutual exclusion in settling gate and defer message commit to post-acceptance ([11a05a1](https://github.com/lemonadesocial/lemonade-cli/commit/11a05a163c9dada609c5932d0fccafb50d91ea06))
* extract crash handlers for testability and use safe stderr output ([f1a36e2](https://github.com/lemonadesocial/lemonade-cli/commit/f1a36e2ff3df9d502b84f0cc3ca0f9cdd0df8b7a))
* extract duplicated .tmp cleanup to helper function ([c665d06](https://github.com/lemonadesocial/lemonade-cli/commit/c665d062a464497c3b2fcde43870f577f19185c0))
* extract validateMode and fix mock-confirms-mock tests ([763c008](https://github.com/lemonadesocial/lemonade-cli/commit/763c008b639004ccaddd7f77ddb32b44d30b8c10))
* extract validation module to avoid barrel-file side effects in tests ([6b2c99e](https://github.com/lemonadesocial/lemonade-cli/commit/6b2c99e1620bd130a0df0e58a7c73857c5f6d9ce))
* fail loudly when verify-dist cannot extract bin import target ([536230d](https://github.com/lemonadesocial/lemonade-cli/commit/536230d19168d519eaa9e57fac4cfe13b30dab50))
* fix ai config ([6d0c4e3](https://github.com/lemonadesocial/lemonade-cli/commit/6d0c4e3aae7c110af6b488bc02e0fe5c22ecb4dc))
* harden ConversationStore against clear-during-turn and mutable leaks ([4eb30b3](https://github.com/lemonadesocial/lemonade-cli/commit/4eb30b31418e8831fac2ae08c1f0d52cad86cf7c))
* harden ConversationStore turn lifecycle and cleanup safety ([1ed2202](https://github.com/lemonadesocial/lemonade-cli/commit/1ed22029328f09b5448334057de80216440b70ac))
* harden credits-mode history formatting against non-text content ([aa183f3](https://github.com/lemonadesocial/lemonade-cli/commit/aa183f31e1b86f9b38bd39a4afd6fdf655b41b1c))
* harden diagnostics selection assertion and strengthen masked cursor test ([5198006](https://github.com/lemonadesocial/lemonade-cli/commit/51980069eda043e4fc90b22ba7663a8c4f700d33))
* harden oauth refresh behavior and add coverage ([4e03e4f](https://github.com/lemonadesocial/lemonade-cli/commit/4e03e4f821ec94a8d397b63ebd58f88693c318f0))
* harden positionToOffset clamp to decouple from early-return ordering ([165068f](https://github.com/lemonadesocial/lemonade-cli/commit/165068f6785291a737f413761a9cce5b270052e9))
* harden removeMessageUpdater docstring, StrictMode log guard, and reset-path test ([0e6002e](https://github.com/lemonadesocial/lemonade-cli/commit/0e6002eb0a2caef635e8226bd127b70ecc10a0d6))
* harden rollback guard, catch-path test coverage, and doc precision ([f4910fd](https://github.com/lemonadesocial/lemonade-cli/commit/f4910fdfb6bef357919ca88177d6c5f8367ed1e9))
* harden schema-aligned queries and input validation ([8255f8a](https://github.com/lemonadesocial/lemonade-cli/commit/8255f8a6fbd48d5cd37e4aa345e2e781c0bb17d1))
* harden TurnCoordinator types, counter isolation, and test coverage ([5829b71](https://github.com/lemonadesocial/lemonade-cli/commit/5829b71ddc00b9abfdf010a8d822107f61fc18a6))
* horizontal tabs, space selector, yellow headings, footer spacing in plan mode ([#64](https://github.com/lemonadesocial/lemonade-cli/issues/64)) ([b2f37fe](https://github.com/lemonadesocial/lemonade-cli/commit/b2f37fe2bbc706bd838006eb7d13a722d3b1ee55))
* improve StatusBar, message distinction, scroll, and space handling ([d68eb61](https://github.com/lemonadesocial/lemonade-cli/commit/d68eb614fde6d7865edac0cbbf67abc44f96b209))
* include failed_at in newsletter list date display ([0746cc8](https://github.com/lemonadesocial/lemonade-cli/commit/0746cc80636ff4bde1979549ec4102c1bb5b8b4b))
* include private field in ticket type mutation responses ([f24a392](https://github.com/lemonadesocial/lemonade-cli/commit/f24a392b11641af430b668507e8fc91eb71d2fd1))
* index-based rollback for cancel/error paths in submit flow ([dffe7f2](https://github.com/lemonadesocial/lemonade-cli/commit/dffe7f24b40eb8fbe81f74ef4055a1c1aa4da280))
* keep &gt; indicator on first line for multiline input ([#107](https://github.com/lemonadesocial/lemonade-cli/issues/107)) ([e8af9af](https://github.com/lemonadesocial/lemonade-cli/commit/e8af9afeae629cf63075c7b697ad0e3dc51d5110))
* keep displayCol in original column space when cursorChar substitutes a wide grapheme ([ae83ac5](https://github.com/lemonadesocial/lemonade-cli/commit/ae83ac57fcc7b57c456364ee57efde6c1888b25e))
* make corruption-path deterministic, extract removeMessageUpdater ([5039775](https://github.com/lemonadesocial/lemonade-cli/commit/50397754cc2bd69a7109413afcdc79d4efdaa1f2))
* make corruption-path idempotent, remove dead removeMessageByIdUpdater ([07b8e89](https://github.com/lemonadesocial/lemonade-cli/commit/07b8e89626c4f6090376c6deb49f4e6eeba0c722))
* make getTerminalProtocol() enforce initialization order ([c173aab](https://github.com/lemonadesocial/lemonade-cli/commit/c173aab9912ef0aad91b36fc4b3e8bfe7ef701b6))
* make Position.column use visual display columns instead of source offsets ([73d9fbf](https://github.com/lemonadesocial/lemonade-cli/commit/73d9fbf0f8903f2bbe319d05bb5130152a1a5e47))
* make removeMessageByIdUpdater idempotent for React StrictMode safety ([5721938](https://github.com/lemonadesocial/lemonade-cli/commit/57219389aac686333648d312fbd7c839f567c2d1))
* make stripEmittedSuffix throw on unexpected suffix instead of returning undefined ([de29f4c](https://github.com/lemonadesocial/lemonade-cli/commit/de29f4cacbc413c4775849021e58d4c11d719e52))
* make useChatEngine index bookkeeping atomic and crash-safe ([7579075](https://github.com/lemonadesocial/lemonade-cli/commit/757907596d5c13be2a09b6c3616c4b3892812a13))
* merge payment categories and clean up redundant tests ([d3de1db](https://github.com/lemonadesocial/lemonade-cli/commit/d3de1db076ed8199f1f0400e8c9642359e60d75c))
* migrate 10 trivial ai-prefixed resolvers to verified direct equivalents ([7d5f6ca](https://github.com/lemonadesocial/lemonade-cli/commit/7d5f6ca3a8e49f58238168ab2b44f85d01bd9a10))
* migrate TOOL_TO_COMMAND map to canonical tool names and update surfaces ([00613c5](https://github.com/lemonadesocial/lemonade-cli/commit/00613c5f4c13423ac2104ebf1757fb72d6d0b0d4))
* move Tempo hint into welcome banner to preserve banner visibility ([#94](https://github.com/lemonadesocial/lemonade-cli/issues/94)) ([23e224d](https://github.com/lemonadesocial/lemonade-cli/commit/23e224d3225925b7d3a01c02fcd907fef82cb5fe))
* move terminal protocol ownership out of MultilineInput ([aef9ee2](https://github.com/lemonadesocial/lemonade-cli/commit/aef9ee2bc7cadf3b2405b4bc4fc4be02dd761ba8))
* normalize payment accounts tool naming and guards ([dde8050](https://github.com/lemonadesocial/lemonade-cli/commit/dde8050b0ebcdcf61251379d5713b65021acf43a))
* persist ai_provider on own_key mode switch and remove dead isSwitching guard ([d62d33b](https://github.com/lemonadesocial/lemonade-cli/commit/d62d33b174dbb3d0baa31628b4777a6a912902c1))
* polish tool discoverability output consistency ([998082e](https://github.com/lemonadesocial/lemonade-cli/commit/998082e3ab1d8bf9dadbeb9a0ac52b0f658cb38e))
* poll for Tempo wallet connection after browser auth ([#97](https://github.com/lemonadesocial/lemonade-cli/issues/97)) ([dd5a546](https://github.com/lemonadesocial/lemonade-cli/commit/dd5a546e37a7adb6501462cd5e6d9ff2a65debca))
* pop failed user message and improve batch test coverage ([a5f3d48](https://github.com/lemonadesocial/lemonade-cli/commit/a5f3d487cbe78a2d7023c2c99ec259b7295800fb))
* prevent API rejection from leading assistant messages after history truncation ([#151](https://github.com/lemonadesocial/lemonade-cli/issues/151)) ([7ffe6c1](https://github.com/lemonadesocial/lemonade-cli/commit/7ffe6c1700860ab28a0f7e768bd7602366a39953))
* prevent cancel-then-resubmit race in TurnCoordinator ([c50bb99](https://github.com/lemonadesocial/lemonade-cli/commit/c50bb99876edf43338164ff1a8f5cfdbcba1cf48))
* prevent orphaned user message on pre-turn failure and clarify token invariant ([48939be](https://github.com/lemonadesocial/lemonade-cli/commit/48939bef345141b6537995e9786ff66348b67e5c))
* prevent stale turn completion from clearing showThinking after cancel→resubmit ([ab317eb](https://github.com/lemonadesocial/lemonade-cli/commit/ab317eb724ccbd6abe06088e466ff9fb80bf6060))
* prevent UI orphan on beginTurn failure and use index-based UI rollback ([4f38219](https://github.com/lemonadesocial/lemonade-cli/commit/4f38219e7b71553d90d4f18610224bc494d7a6e5))
* protect coordinator from pre-stream setup throws and unhandled completion rejection ([ab9656d](https://github.com/lemonadesocial/lemonade-cli/commit/ab9656d8ab693629f8fc824884c93c2d00221316))
* read version from package.json instead of hardcoded value ([c0773e3](https://github.com/lemonadesocial/lemonade-cli/commit/c0773e3f81938c0a95b5391a951275039f40c081))
* readline UX polish - Escape cancel, spinner cleanup, prompt alignment ([4941a2e](https://github.com/lemonadesocial/lemonade-cli/commit/4941a2e5faea498a96b102f1f33212eb7634239c))
* recover chat history after streaming errors ([28cc1a4](https://github.com/lemonadesocial/lemonade-cli/commit/28cc1a43a02672c46d109a053b56264e1d47b229))
* refresh expired oauth tokens automatically ([2dede6a](https://github.com/lemonadesocial/lemonade-cli/commit/2dede6ab2feeeb21fb3760384a3e9ae7e91353e3))
* reject arrays in parseJsonObject helper ([0a406a9](https://github.com/lemonadesocial/lemonade-cli/commit/0a406a9af916c5f05cda0789c4deef3783051911))
* reject unexpected non-emitted files in dist verification ([08f4080](https://github.com/lemonadesocial/lemonade-cli/commit/08f40807236fea6b61e6ee10c5fbf1ce1b8a8b86))
* reject zero quantity in ticket price chat tool ([0bba55f](https://github.com/lemonadesocial/lemonade-cli/commit/0bba55fd46e821daff965a74ec3459336efe8f60))
* remove dead assertions module, wire selection diagnostics, add masked cursor-in-selection tests ([9468ce4](https://github.com/lemonadesocial/lemonade-cli/commit/9468ce45d6f50e85054675754b60cee3d5148d58))
* remove dead code branch and rename test file to match source ([c88628c](https://github.com/lemonadesocial/lemonade-cli/commit/c88628c29ddd64b3cfab6ae4efb1994dbdb6a5a8))
* remove dead code branch and unused shebangs in build scripts ([9509181](https://github.com/lemonadesocial/lemonade-cli/commit/9509181f090f9edba4835fd64c6c2d11687cd2e6))
* remove dead originalFetch variable in creditsModeRuntime test ([cd9edce](https://github.com/lemonadesocial/lemonade-cli/commit/cd9edce62853fc3466873234fc57ce9183ad5295))
* remove duplicate event_payment_summary registration ([470b7f8](https://github.com/lemonadesocial/lemonade-cli/commit/470b7f836cce7d50e1d36a1c1d6db3a0e1d60e2e))
* remove fixed viewport to enable natural terminal scrolling ([#56](https://github.com/lemonadesocial/lemonade-cli/issues/56)) ([90eb2a9](https://github.com/lemonadesocial/lemonade-cli/commit/90eb2a919f8ef2563cefac40bc47ef7da244513c))
* remove generated skills from npm files and deduplicate version module ([72851f4](https://github.com/lemonadesocial/lemonade-cli/commit/72851f4f03e4edc9bbd28400294dc093ee273b33))
* remove risky .tmp recovery, add temp cleanup in readConfig ([b60f3e8](https://github.com/lemonadesocial/lemonade-cli/commit/b60f3e8efc06ab4949710c3c037ddeaf618a197a))
* remove Tempo hint from welcome, fix multiline input colors and placeholder ([#106](https://github.com/lemonadesocial/lemonade-cli/issues/106)) ([5cb7cc2](https://github.com/lemonadesocial/lemonade-cli/commit/5cb7cc251fad146761e5c808dea727aa00fe79b4))
* remove unused destructured variables flagged by linter ([b005e35](https://github.com/lemonadesocial/lemonade-cli/commit/b005e3561454e0d3d13bf2e7a42df45f6d6cde96))
* remove unused retryable field from classifyError ([0854d40](https://github.com/lemonadesocial/lemonade-cli/commit/0854d4021ad56ce535f4a39520b7bfa0cb4913b8))
* render multiline input as separate lines with previous lines above TextInput ([#76](https://github.com/lemonadesocial/lemonade-cli/issues/76)) ([0bba66f](https://github.com/lemonadesocial/lemonade-cli/commit/0bba66f93e4bec9d101fbfab10de5f407584ed12))
* render welcome banner inside Ink fullscreen instead of pre-Ink stdout ([#54](https://github.com/lemonadesocial/lemonade-cli/issues/54)) ([dfb4db1](https://github.com/lemonadesocial/lemonade-cli/commit/dfb4db117afa138984df9a5866bb15832c902348))
* repair broken page builder tools and add page config management ([102f140](https://github.com/lemonadesocial/lemonade-cli/commit/102f140c06960e2cf900d631f831bab0a9b02ffd))
* replace ASCII text logo with braille lemon art ([6101b08](https://github.com/lemonadesocial/lemonade-cli/commit/6101b08da53af16205f90c5e4423084db89d560b))
* replace boolean turn lock with token model to prevent stale-finally race ([3fe9c05](https://github.com/lemonadesocial/lemonade-cli/commit/3fe9c05d5314efd86f99cec7b5f1bf5ebf2bc3fd))
* replace deferred ref-based UI rollback with synchronous ID mechanism ([f631040](https://github.com/lemonadesocial/lemonade-cli/commit/f631040ffcc24ca0240aaf6f8b85e12512c13c51))
* replace ghost "space switch" command references with correct guidance ([#148](https://github.com/lemonadesocial/lemonade-cli/issues/148)) ([c29d4ca](https://github.com/lemonadesocial/lemonade-cli/commit/c29d4caf88b900c611c67b22f1cbf2d9e4148708))
* replace Ink UI with readline + chalk for reliable terminal rendering ([cece20f](https://github.com/lemonadesocial/lemonade-cli/commit/cece20fc35261a6048796ec4405fefff0a2c2df9))
* replace redundant dynamic import of getModelsForProvider with static import ([a3a3001](https://github.com/lemonadesocial/lemonade-cli/commit/a3a300156765a4ea9869ffc8d813956ddb85678f))
* replace unsafe NOOP cast with IInputMonitor interface ([096191a](https://github.com/lemonadesocial/lemonade-cli/commit/096191a85bb327e898d0db1a6bc47ac737f4cd7b))
* resolve credits space title from actual selected space, remove dead guard ([ecd9b81](https://github.com/lemonadesocial/lemonade-cli/commit/ecd9b81047071f5f2478ebb34af7dda488f164ba))
* resolve Ink UI layout, scroll, and tool result format bugs ([5759cff](https://github.com/lemonadesocial/lemonade-cli/commit/5759cffeda43062965bfc402a40de785c3c2573a))
* resolve multiline input indent and backspace boundary bugs ([#112](https://github.com/lemonadesocial/lemonade-cli/issues/112)) ([5b5ab79](https://github.com/lemonadesocial/lemonade-cli/commit/5b5ab79c6acc9e446dd4281f728bc4526d587575))
* resolve provider-history race, remove dead code, fix BTW error prefix ([86d966a](https://github.com/lemonadesocial/lemonade-cli/commit/86d966a1df2c4a74460153ac4873e600e2f33c2a))
* resolve remaining event schema alignment review findings ([7af8432](https://github.com/lemonadesocial/lemonade-cli/commit/7af8432e0f90d8cb32d2a68cd7048d0f0e6cb9a9))
* resolve review nits — add missing afterEach import, remove non-null assertions ([8a45d90](https://github.com/lemonadesocial/lemonade-cli/commit/8a45d901ff5c92e06d8c497453339fd8d9fc9dff))
* resolve scroll, billing, message distinction, model switch, autocomplete, thinking words, StatusBar layout ([10d5f88](https://github.com/lemonadesocial/lemonade-cli/commit/10d5f88e93ddd120a23a28a58a7764ad3be4447e))
* resolve Tempo PATH after install, use pipe stdio to avoid breaking Ink terminal ([#95](https://github.com/lemonadesocial/lemonade-cli/issues/95)) ([8623512](https://github.com/lemonadesocial/lemonade-cli/commit/862351239c286792cc30846b2a1308474ae7ce1d))
* resolve TurnCoordinator ownership, staleness, race, and BTW error regressions ([673f183](https://github.com/lemonadesocial/lemonade-cli/commit/673f18316dcbfcfbf766620735c2dfafd3c177fc))
* resolve zero-width grapheme black hole in positionToOffset ([1b442a0](https://github.com/lemonadesocial/lemonade-cli/commit/1b442a05f57d2b43aeecbd6333f0a26871edece0))
* restore [btw] context prefix on BTW turn error messages ([3d1c398](https://github.com/lemonadesocial/lemonade-cli/commit/3d1c3985c06ac7d583c487076c25bc0b8c789974))
* restore orchestrator progress file deleted in error ([7262768](https://github.com/lemonadesocial/lemonade-cli/commit/7262768d29dc5dcd2ea7819d6d7410ca1764457d))
* revert additional incompatible resolver switches found in Karen review ([b9fb280](https://github.com/lemonadesocial/lemonade-cli/commit/b9fb280380d48e06aae4163dbe50fe71aaeea6df))
* revert incompatible resolver switches to ai-prefixed pending proper migration ([42c110f](https://github.com/lemonadesocial/lemonade-cli/commit/42c110fb6d6ef9bd02ac9f065cb92aa721aed947))
* revert package name to @lemonade-social/cli ([9f20cd8](https://github.com/lemonadesocial/lemonade-cli/commit/9f20cd8946bc5c354a01b75d1d14688ac43c7dee))
* revert to AI event endpoints — standard endpoints require different auth/schema ([#85](https://github.com/lemonadesocial/lemonade-cli/issues/85)) ([a4149de](https://github.com/lemonadesocial/lemonade-cli/commit/a4149dee3ef643a7e8314c8608654189e384073c))
* revert unsupported timezone and hosted_by fields from GraphQL queries ([#66](https://github.com/lemonadesocial/lemonade-cli/issues/66)) ([8240155](https://github.com/lemonadesocial/lemonade-cli/commit/824015569d9dca3d77c93742959b7a07b676eec0))
* rewrite graphemeCount to avoid unused loop variable ([ecfc4f6](https://github.com/lemonadesocial/lemonade-cli/commit/ecfc4f6e1438a09a10b5dfbe634151fa4a45e6d7))
* roll back cancelled turn user message from provider history ([b9bc069](https://github.com/lemonadesocial/lemonade-cli/commit/b9bc069fc19d9dd7d84a5a9e1d513283342dc797))
* roll back orphaned BTW user message on turn failure ([176a560](https://github.com/lemonadesocial/lemonade-cli/commit/176a5603227a92c2f30018405e6e06a3b440b6e5))
* sanitize sensitive tool args, validate HTTPS, restrict export permissions ([#88](https://github.com/lemonadesocial/lemonade-cli/issues/88)) ([99e99aa](https://github.com/lemonadesocial/lemonade-cli/commit/99e99aaafab01b1d14dcaf278a26e2624e41bac7))
* shift+enter multiline, force plan mode on missing params, render markdown ([#60](https://github.com/lemonadesocial/lemonade-cli/issues/60)) ([2552e5a](https://github.com/lemonadesocial/lemonade-cli/commit/2552e5ae4d58da30fdb54f3954cbf7a48f6ff860))
* show actual API error instead of generic "Invalid key" message ([7f5e36f](https://github.com/lemonadesocial/lemonade-cli/commit/7f5e36f577b9d376a68a9937dd9494d846b25b31))
* show clear step-by-step instructions during Tempo wallet login ([#99](https://github.com/lemonadesocial/lemonade-cli/issues/99)) ([2f1816b](https://github.com/lemonadesocial/lemonade-cli/commit/2f1816b3f475246c452e6d8776162f89267e7937))
* show help menu when Tempo CLI not installed instead of error ([#92](https://github.com/lemonadesocial/lemonade-cli/issues/92)) ([a1e8998](https://github.com/lemonadesocial/lemonade-cli/commit/a1e8998d7078b96a5db5ad233bea7dc7047cc45d))
* show Tempo wallet hint on startup ([#93](https://github.com/lemonadesocial/lemonade-cli/issues/93)) ([b4031a0](https://github.com/lemonadesocial/lemonade-cli/commit/b4031a088446620eb2274070874dd5516fb9fabe))
* show thinking spinner during loading and support shift+enter multiline ([#58](https://github.com/lemonadesocial/lemonade-cli/issues/58)) ([ae22fe6](https://github.com/lemonadesocial/lemonade-cli/commit/ae22fe6e7308db4eda9a9a740868eff4e0b111ad))
* show valid keys in config set help text ([808ab9b](https://github.com/lemonadesocial/lemonade-cli/commit/808ab9bd2f1855a263cd7c45aa029426b467cfa4))
* split Ink rendering from message output for proper scroll and history ([172b54a](https://github.com/lemonadesocial/lemonade-cli/commit/172b54ac9e39574e8412aab6acc73aadb50e19d6))
* start polling immediately after auth URL shown, don't await login process ([#98](https://github.com/lemonadesocial/lemonade-cli/issues/98)) ([5fd9d1d](https://github.com/lemonadesocial/lemonade-cli/commit/5fd9d1d03da759126d11263ea6c4ac8de9d44067))
* stream Tempo login output so user sees confirmation code, 2min timeout ([#96](https://github.com/lemonadesocial/lemonade-cli/issues/96)) ([9be3f40](https://github.com/lemonadesocial/lemonade-cli/commit/9be3f40f7d667d8920f2c4e6a868af44099e68f4))
* suppress unused-var lint error in graphemeCount ([6983a71](https://github.com/lemonadesocial/lemonade-cli/commit/6983a71211d8419b1d470ab32da741bc040febb7))
* switch all ai-prefixed resolvers to direct backend equivalents ([4e030aa](https://github.com/lemonadesocial/lemonade-cli/commit/4e030aa1594ba8bba8ad90c84516046dcf067b75))
* switch to eslint 9 flat config, remove unused import ([5a0f093](https://github.com/lemonadesocial/lemonade-cli/commit/5a0f093abbfd7c25b7866be336021e5f766783b7))
* **test:** make abort mid-stream assertion non-vacuous ([4780dd9](https://github.com/lemonadesocial/lemonade-cli/commit/4780dd9d503fd5816559d228ba252117ebd2b44a))
* trigger release ([a1ed29f](https://github.com/lemonadesocial/lemonade-cli/commit/a1ed29fcd25758484d63d51a949955ed54fbdaf1))
* trigger release ([5806966](https://github.com/lemonadesocial/lemonade-cli/commit/58069669f5e4efbbc758a468a32f16980ed9b385))
* trigger release ([de430d5](https://github.com/lemonadesocial/lemonade-cli/commit/de430d5cc8bbc3e753106e1341686d0e1cb2968e))
* unify paid-tier 0-credits behavior and clean up App render churn ([13c7acb](https://github.com/lemonadesocial/lemonade-cli/commit/13c7acb99b758575e7f0a3352bf84cb25e1d769a))
* update aiGetMe query to match new AIGetMeResponse schema ([9de7741](https://github.com/lemonadesocial/lemonade-cli/commit/9de774114ceef8693f5a1477389ac8e2589643f9))
* update codegen resolver map to use createEvent/updateEvent ([c1d9b66](https://github.com/lemonadesocial/lemonade-cli/commit/c1d9b667477c1574c68c6eb154895d44a03d26fb))
* update discovery doc to reflect current category metadata ([6c5c8eb](https://github.com/lemonadesocial/lemonade-cli/commit/6c5c8ebc55ba080baef3b8c021023039a9fe4122))
* update npm scope to [@lemonade](https://github.com/lemonade)_social/cli ([e722101](https://github.com/lemonadesocial/lemonade-cli/commit/e722101d3d1c7fdd2e04def28af6e7421d0b856b))
* update npm scope to @lemonade-social/cli ([b5e65c6](https://github.com/lemonadesocial/lemonade-cli/commit/b5e65c6d87f3a4e1478bced4e7cf5e5e9b8b4561))
* update placeholder text and add more rotating tips ([#77](https://github.com/lemonadesocial/lemonade-cli/issues/77)) ([c9945f5](https://github.com/lemonadesocial/lemonade-cli/commit/c9945f51fc860f8f6af8916bd2c30f106c53b575))
* update stale MCP tool label to canonical naming ([cef9e0c](https://github.com/lemonadesocial/lemonade-cli/commit/cef9e0c79967b0a9cbaec3d76c69023adf6c956e))
* update toolbar on space switch, improve Stripe error handling, add URL guidance ([#61](https://github.com/lemonadesocial/lemonade-cli/issues/61)) ([b9dc3eb](https://github.com/lemonadesocial/lemonade-cli/commit/b9dc3eb37bd5c6fb40591392e8c0004828d54a0f))
* use --no-browser flag for Tempo login, suggest incognito for redirect issues ([#102](https://github.com/lemonadesocial/lemonade-cli/issues/102)) ([56c4ceb](https://github.com/lemonadesocial/lemonade-cli/commit/56c4cebe72e9670a3e6d22dd30b805d1f425f3bd))
* use atomic write-then-rename for auth config persistence ([ba42735](https://github.com/lemonadesocial/lemonade-cli/commit/ba427352382e7848ca1fd866a7950604bcb9423b))
* use backslash for multiline input, prevent concurrent turn execution ([#69](https://github.com/lemonadesocial/lemonade-cli/issues/69)) ([18939e4](https://github.com/lemonadesocial/lemonade-cli/commit/18939e4e266bc00fc213bbea34c11cc909b5c527))
* use display-column semantics in MultilineInput rendering ([18022bd](https://github.com/lemonadesocial/lemonade-cli/commit/18022bdb542d29edf504439861ac5eaa0a344362))
* use import instead of require for package.json ([6bfd469](https://github.com/lemonadesocial/lemonade-cli/commit/6bfd469eb0e3d4742652882a03ce870f5e76f918))
* use length snapshot for safe message rollback in batch error path ([27c669c](https://github.com/lemonadesocial/lemonade-cli/commit/27c669c5cb1db75ada98e5d1603acaa3f1dca1fb))
* use shared jsonSuccess/jsonError helpers in batch mode ([534163f](https://github.com/lemonadesocial/lemonade-cli/commit/534163fe7e7a9409d19635af48fc2e56ac9df27a))
* use single quotes for non-interpolated GraphQL string ([173566e](https://github.com/lemonadesocial/lemonade-cli/commit/173566e945016e31d740c1e1f06a7ff39d3f2fda))
* use single quotes in switchHandlers return string ([851f577](https://github.com/lemonadesocial/lemonade-cli/commit/851f57722c656498b36b0f41c01b171e5de287f5))
* use structural JSON parsing in batch success test ([6d9610b](https://github.com/lemonadesocial/lemonade-cli/commit/6d9610be072c5d5e9f44c5816364bbb58d068de4))
* use unscoped package name for npm publish ([6d2fd81](https://github.com/lemonadesocial/lemonade-cli/commit/6d2fd8148b84b6e0f72ee0ae5fce10ef90028f01))
* use visual display columns in MeasuredText position mapping ([#114](https://github.com/lemonadesocial/lemonade-cli/issues/114)) ([9ecee93](https://github.com/lemonadesocial/lemonade-cli/commit/9ecee93b57abbca6891d7767459e5f3eeda4af48))
* validate --mode flag and add it to help text ([7c6e601](https://github.com/lemonadesocial/lemonade-cli/commit/7c6e601b5d8321b350c883028f4d53caba4527b2))
* validate cursor bounds on every MultilineInput state update ([7b8b03f](https://github.com/lemonadesocial/lemonade-cli/commit/7b8b03f4a701c82c7768c199cf718a5b76bbf227))
* verify all emitted file types and resolve paths from script location ([f07449b](https://github.com/lemonadesocial/lemonade-cli/commit/f07449b14d5f1619e4bd25b6a70c522e61905308))
* verify application answers shape and unify free-ticket input ([d072736](https://github.com/lemonadesocial/lemonade-cli/commit/d07273698deee86f7ce3dfa70f36499e58652be1))
* warn on unknown CLI flags instead of silently ignoring them ([#149](https://github.com/lemonadesocial/lemonade-cli/issues/149)) ([def8c60](https://github.com/lemonadesocial/lemonade-cli/commit/def8c60b17a2c2acc68037cf0c1eac96d6333c32))

## [1.2.1](https://github.com/lemonadesocial/lemonade-cli/compare/v1.2.0...v1.2.1) (2026-03-31)


### Bug Fixes

* improve StatusBar, message distinction, scroll, and space handling ([d68eb61](https://github.com/lemonadesocial/lemonade-cli/commit/d68eb614fde6d7865edac0cbbf67abc44f96b209))
* replace ASCII text logo with braille lemon art ([6101b08](https://github.com/lemonadesocial/lemonade-cli/commit/6101b08da53af16205f90c5e4423084db89d560b))
* resolve Ink UI layout, scroll, and tool result format bugs ([5759cff](https://github.com/lemonadesocial/lemonade-cli/commit/5759cffeda43062965bfc402a40de785c3c2573a))
* resolve scroll, billing, message distinction, model switch, autocomplete, thinking words, StatusBar layout ([10d5f88](https://github.com/lemonadesocial/lemonade-cli/commit/10d5f88e93ddd120a23a28a58a7764ad3be4447e))

## [1.2.0](https://github.com/lemonadesocial/lemonade-cli/compare/v1.1.0...v1.2.0) (2026-03-31)


### Features

* add 31 new tools, AI credits, subscriptions, and billing safety dual-mode ([8604303](https://github.com/lemonadesocial/lemonade-cli/commit/86043031224f20a4ea021b0676d6eb8c46039635))
* add 34 new tools for events, co-hosts, broadcasting, email, guests, analytics, pages, templates ([ddb013d](https://github.com/lemonadesocial/lemonade-cli/commit/ddb013d52e5f304a8576a40c0d4146bfb5584920))
* add Zesty skills system with 6 domain skill files and /name command ([701c042](https://github.com/lemonadesocial/lemonade-cli/commit/701c0429dfa74d2419be20d0cc0785fa4df6c20f))

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
