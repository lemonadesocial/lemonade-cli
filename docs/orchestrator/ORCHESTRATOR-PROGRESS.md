# Orchestrator Progress Log

This file must be maintained by the ORCHESTRATOR during the session.

Purpose:
- give the user a stable local record of what has already happened
- make handoff across sessions easy
- avoid losing track of built work, commits, PRs, and deferred items

Update rules:
- update this file at the end of every Gate A
- update this file at the end of every Gate B
- update this file immediately after PR creation
- update this file immediately after Karen review if findings exist
- update this file immediately after a branch becomes merge-ready
- update this file immediately after merge
- update this file immediately after choosing the next issue
- update this file immediately after every implementation/remediation durability check
- do not wait until the end of the overall program

Keep entries concise and factual.
Do not include internal chain-of-thought.

Durability requirement:
- record commit hash(es) as soon as implementation or remediation lands
- record whether the branch state is durable
- record any recovery action taken

---

## Active Branch

- Branch: (none — merged to main)
- Status: MERGED
- Scope: API key error styling and guidance
- Current gate: Complete

## Current Loop State

- Last merged PR: #146
- Last merge commit: bee50c5
- Current next-issue status: session complete — remaining items are low-value polish
- Current recommended next branch: none (see deferred items)

## Session Summary (2026-04-05, session 3)

Four cycles completed:
1. #143 — Validate --mode CLI flag and add it to help text (fix/validate-mode-flag)
2. #144 — Align batch mode JSON output with standard CLI envelope (fix/batch-json-envelope-consistency)
3. #145 — Show valid keys in config set help text (fix/config-set-help-keys)
4. #146 — Add chalk styling and credits guidance to API key error (fix/unstyled-api-key-error)

## Session Summary (2026-04-05, session 1)

Two cycles completed:
1. #136 — Streaming retry with exponential backoff (feat/streaming-retry-backoff)
2. #137 — Atomic write-then-rename for auth config (fix/atomic-config-writes)

## Session Summary (2026-04-05, session 2)

Four cycles completed:
1. #138 — Batch mode JSON error envelope (fix/batch-json-error-envelope)
2. #139 — Crash handlers for unhandled rejections/exceptions (fix/unhandled-rejection-handler)
3. #140 — Remove dead retryable field (fix/remove-dead-retryable-field)
4. #141 — Extract shared safeErrorMessage utility (refactor/shared-safe-error-message)

All high/medium priority deferred items resolved. Two previously reported issues (terminal corruption on early exit, process.exit without cleanup) debunked through code analysis.

## Branch Timeline

### Gate A

- Date: 2026-04-05
- Branch: fix/streaming-error-recovery
- Chosen issue: Streaming errors leave orphaned user messages, causing cascading history corruption and unrecoverable sessions
- Why it is next: Highest-impact UX issue — a single transient error (rate limit, overloaded server) permanently breaks the session until /clear. Affects all Claude Code users who hit any provider error during streaming.
- Scope: 3 files — handler.ts error path rollback, TurnCoordinator error cleanup, history.ts same-role guard
- Agent plan: implementation → audit → remediation → PR → Karen → final audit

### Implementation

- What was built: Streaming error rollback in handler.ts (rolls back user message on iteration 0 errors), extracted shared rollbackUncommittedUserMessage in TurnCoordinator, actionable error messages via formatStreamingErrorMessage with .status-based classification
- Commit(s): 28cc1a4 (initial impl), 6c85473 (audit remediation)
- Checks run: tsc --noEmit, yarn build, vitest run (all pass)
- Notes: history.ts sanitizeConsecutiveRoles was added then removed per audit — dead code with flawed tool_use/tool_result handling

### Hostile Audit

- Round 1: 3 MAJOR, 3 MINOR, 2 NIT. Key issues: dead sanitizeConsecutiveRoles, wrong-message rollback in tool loops, dual rollback paths
- Round 2: 2 MINOR, 3 NIT. All MAJORs resolved. Verdict: safe to continue
- Remediation commit(s): 6c85473
- Notes: Dual rollback paths (handler.ts + TurnCoordinator) verified safe — TurnCoordinator rollback is idempotent via length check

### Gate B

- Status: PASS
- Files changed: src/chat/stream/handler.ts, src/chat/runtime/TurnCoordinator.ts, tests/unit/chat/handler.test.ts, tests/unit/chat/runtime/turnCoordinator.test.ts (4 files, +360 -14)
- Checks: tsc clean, build clean, all tests pass
- Residual risks: (1) No auto-retry for transient errors (deferred). (2) Partial text + error leaves user message without assistant reply — acceptable, next turn still works. (3) .status-based error classification untested (NIT, string fallback is tested)

### PR

- PR number: #135
- PR title: fix: recover chat history after streaming errors
- PR URL: https://github.com/lemonadesocial/lemonade-cli/pull/135
- Base: main
- Head: fix/streaming-error-recovery

### Karen Review

- Verdict: APPROVE
- Findings summary: 1 MAJOR (reverse-scan rollback → simplified to last-element check), 1 MINOR (type cast readability), 2 NIT (missing network codes, imprecise comment)
- Remediation commit(s): 038d7c2
- Notes: All 4 findings fixed and pushed

### Final Review / Merge Readiness

- Final zero-findings verdict: PASS — zero findings
- Ready to merge: YES → MERGED 2026-04-05T13:54:04Z
- Merge commit: c1a681b
- Important notes: 3 commits total (28cc1a4 impl, 6c85473 audit remediation, 038d7c2 Karen remediation). All tests pass. Build clean. Remote branch deleted.

### Merge

- Merge approved: yes
- Merged at: 2026-04-05T13:54:04Z
- Merge commit: c1a681b
- Local main synced: yes
- Post-merge notes: branch complete; next issue should be selected without restarting the orchestrator session

### Next Issue

- Chosen next issue: Streaming retry with exponential backoff
- Why it is next: Highest-impact UX issue after #135 — transient errors (429, 529, network) still force manual re-send. Auto-retry transforms these from session-disrupting to transparent recovery.
- Branch: feat/streaming-retry-backoff
- Important carry-forward notes: tool retry dead code remains a separate follow-up branch candidate

---

## Branch: feat/streaming-retry-backoff

### Gate A

- Date: 2026-04-05
- Branch: feat/streaming-retry-backoff
- Chosen issue: Transient streaming errors (429, 529, network) fail immediately — no auto-retry
- Why it is next: Highest-impact UX issue. Every transient error forces manual re-send. #135 added rollback (preventing corruption), but users still lose the response. Auto-retry with backoff would make most transient errors transparent.
- Scope: Add retry loop with exponential backoff in handler.ts for iteration-0 transient errors. Show retry feedback. Respect abort signals. Add unit tests.
- Key files:
  - src/chat/stream/handler.ts — retry loop + backoff logic
  - tests/unit/chat/handler.test.ts — retry tests
- Backend/runtime facts: Anthropic SDK maxRetries:2 covers initial request only, not mid-stream. formatStreamingErrorMessage already classifies by status code. Abort signal from TurnCoordinator wired up.
- Agent plan: implementation → audit → remediation → PR → Karen → final audit
- Side-findings logged for future branches:
  - History file non-atomic writes (data-loss risk)
  - process.exit() without cleanup paths
  - classifyError dead retryable field in tools/executor.ts

### Implementation

- What was built: Retry loop with exponential backoff in handler.ts for iteration-0 transient errors (429, 529, network). isRetryableStreamingError classifier, getRetryDelay with jitter + Retry-After support, sleepWithAbort cancellable sleep. Retry warning messages via engine/stdout. Updated error messages after retry exhaustion.
- Commit(s): e4aa1dd (initial impl), ca9e3ab (audit remediation)
- Checks run: tsc --noEmit, vitest run (31 tests pass), yarn build (all clean)
- Notes: 8 new tests total (7 retry behavior + 1 backoff escalation)

### Hostile Audit

- Round 1: 2 MAJOR, 3 MINOR, 3 NIT. Key issues: iteration-- pattern needs comment, sleepWithAbort early abort check, exported constants hygiene, delay escalation test gap
- Round 2: ZERO FINDINGS. All round-1 issues resolved.
- Remediation commit(s): ca9e3ab
- Notes: No blockers found. iteration-- pattern verified safe. Jitter ranges verified non-overlapping.

### Gate B

- Status: PASS
- Files changed: src/chat/stream/handler.ts, tests/unit/chat/handler.test.ts (2 files)
- Checks: tsc clean, build clean, all 31 tests pass
- Residual risks: (1) Retry-After date format not parsed (safe fallback to backoff). (2) No retry for mid-stream errors (by design). (3) String matching "429" could theoretically false-positive (consistent with existing code).

### PR

- PR number: #136
- PR title: feat: add retry with exponential backoff for transient streaming errors
- PR URL: https://github.com/lemonadesocial/lemonade-cli/pull/136
- Base: main
- Head: feat/streaming-retry-backoff
- Commits: 162fa11 (impl), a11e4ed (Karen remediation)

### Karen Review

- Verdict: REQUEST_CHANGES → remediated → ZERO FINDINGS
- Findings: 1 MAJOR (let→const), 1 MINOR (Retry-After header access), 1 NIT (test helper)
- Remediation commit: a11e4ed
- Final zero-findings audit: PASS

### Gate C

- Status: PASS
- Ready to merge: YES

### Merge

- Merged at: 2026-04-05
- Merge commit: 1809302
- Local main synced: yes
- Remote branch deleted: yes
- Post-merge notes: 2 commits (162fa11 impl, 98506e6 Karen remediation). All tests pass. Build clean.

---

## Branch: fix/atomic-config-writes

### Gate A

- Date: 2026-04-05
- Branch: fix/atomic-config-writes
- Chosen issue: Auth config (`~/.lemonade/config.json`) written with bare `writeFileSync` — crash during write corrupts the file, forcing re-authentication
- Why it is next: Data-integrity issue affecting every user. Auth config is the only persistent state the CLI writes to disk. Corruption = forced re-login. Discovery correction: chat messages are in-memory only (no disk persistence), so the original "session non-atomic writes" finding was invalid.
- Scope: Make `writeConfig` in `src/auth/store.ts` use write-to-temp-then-rename atomic pattern. Add unit tests.
- Key files:
  - src/auth/store.ts — writeConfig function (line 52)
  - tests/unit/auth/store.test.ts — new or existing tests
- Backend/runtime facts: Node.js `fs.renameSync` is atomic on same-filesystem (POSIX). Config dir is `~/.lemonade/`, temp file goes in same dir.
- Agent plan: implementation → audit → remediation → PR → Karen → final audit

### Implementation

- What was built: Atomic write-then-rename in writeConfig, stale .tmp cleanup in readConfig, cleanupStaleTmpFile helper
- Commit(s): ba42735 (atomic write impl), b60f3e8 (remove risky .tmp recovery + cleanup), c665d06 (Karen fix: extract helper)
- Checks run: tsc, vitest (10 tests), build — all pass, CI green
- Notes: First implementation had .tmp recovery logic; audit found it risks restoring stale data. Removed in remediation.

### Hostile Audit

- Round 1: 2 MAJOR (stale .tmp recovery risk, leaked .tmp), 2 MINOR, 2 NIT. Verdict: FIX BEFORE CONTINUING
- Round 2: ZERO FINDINGS. All resolved.
- Key action: Removed .tmp recovery entirely from readConfig — fall back to defaults on corruption

### PR

- PR number: #137
- PR title: fix: use atomic write-then-rename for auth config persistence
- PR URL: https://github.com/lemonadesocial/lemonade-cli/pull/137
- Commits: ba42735, b60f3e8, c665d06

### Gate B

- Status: PASS
- Files changed: src/auth/store.ts, tests/unit/auth/store.test.ts (2 files, +108 -19)
- Checks: tsc clean, build clean, 10 auth store tests pass, CI green
- Residual risks: (1) No fsync before rename — power loss (not process crash) could leave empty file. (2) Windows NTFS rename not truly atomic. Both acceptable for a CLI tool.

### Karen Review

- Verdict: APPROVE (1 MINOR: duplicated cleanup — fixed in c665d06)
- Final zero-findings audit: PASS

### Gate C

- Status: PASS
- Ready to merge: YES

### Merge

- Merged at: 2026-04-05
- Merge commit: ae2b727
- Local main synced: yes
- CI: all 3 checks green (lint, build, test)

## Branch: fix/batch-json-error-envelope

### Gate A

- Date: 2026-04-05
- Branch: fix/batch-json-error-envelope
- Chosen issue: Batch mode (`--json`) emits no JSON output when handleTurn throws — JSON clients get silent failure/timeout
- Why it is next: Highest-impact remaining issue. Every error in batch mode breaks the JSON API contract. Programmatic consumers (automation, CI/CD, Claude Code integration) get nothing on stdout when errors occur, causing timeouts and silent failures.
- Scope: In `src/chat/batch.ts` catch block (line 44-46), emit a JSON error envelope to stdout when `jsonOutput` is true. Add unit tests.
- Key files:
  - src/chat/batch.ts — catch block in batchMode (line 44-46)
  - tests/unit/chat/batch.test.ts — new or existing tests
- Backend/runtime facts: No API changes needed. Batch mode is stateless. Error envelope should include `{ error: string }` at minimum.
- Agent plan: implementation → audit → remediation → PR → Karen → final audit
- Side-findings logged for future branches:
  - Terminal corruption on early main() failure (alt screen buffer not cleaned up)
  - JSON.parse() silent fallback in OpenAI provider (tool args become {})

### Implementation

- What was built: JSON error envelope emission in batch.ts catch block when jsonOutput is true. 3 new unit tests (error+json, error+no-json, success+json).
- Commit(s): 51820ad
- Checks run: tsc --noEmit, vitest (937 tests pass), yarn build — all clean
- Files changed: src/chat/batch.ts, tests/unit/chat/batch.test.ts
- Durability: confirmed (branch clean, commit durable)

### Hostile Audit

- Round 1: 4 MINOR, 3 NIT. Key issues: dangling user message after error, inconsistent envelope structure, fragile test matching, missing multi-line/non-Error tests
- Round 2: 2 NIT only (success test consistency, pop edge case). Verdict: SAFE TO CONTINUE
- Remediation commit(s): a5f3d48 (round 1 fixes), 6d9610b (round 2 NIT fix)
- Deferred findings: safeErrorMessage dedup (3 files, separate branch), envelope discriminator (design change), messages.pop() mid-turn edge case (pre-existing)

### Gate B

- Status: PASS
- Files changed: src/chat/batch.ts, tests/unit/chat/batch.test.ts (2 files)
- Commits: 51820ad (impl), a5f3d48 (audit remediation), 6d9610b (NIT fix)
- Checks: tsc clean, build clean, 939 tests pass
- Residual risks: (1) safeErrorMessage duplication across 3 files. (2) No envelope discriminator (error uses `error` key, success uses `text` key). (3) messages.pop() doesn't handle mid-turn mutations (pre-existing edge case).

### PR

- PR number: #138
- PR title: fix: emit JSON error envelope in batch mode on streaming failure
- PR URL: https://github.com/lemonadesocial/lemonade-cli/pull/138
- Base: main
- Head: fix/batch-json-error-envelope
- Commits: 51820ad (impl), a5f3d48 (audit remediation), 6d9610b (NIT fix), 27c669c (Karen fix)

### Karen Review

- Verdict: REQUEST_CHANGES → remediated → ZERO FINDINGS
- Findings: 1 MAJOR (pop→preLen snapshot), 1 NIT (dual-output comment)
- Remediation commit: 27c669c
- Final zero-findings audit: PASS

### Gate C

- Status: PASS
- Ready to merge: YES

### Merge

- Merged at: 2026-04-05
- Merge commit: 17d2d11
- Local main synced: yes
- CI: all 3 checks green (lint, build, test)
- Remote branch deleted: yes

---

## Deferred / Follow-up Items

- Item: ~~Add automatic retry with exponential backoff for transient streaming errors~~ DONE in #136

- Item: ~~classifyError retryable field in tools/executor.ts is computed but never consumed~~ DONE in #140

- Item: ~~process.exit() calls without cleanup — many exit paths in src/chat/index.ts~~ DEBUNKED: early exits happen before terminal escape codes are written (codes only written inside runTerminalUI). No terminal state to restore. process.on('exit') handler in terminal.ts covers post-TTY-init crashes.

- Item: ~~No process.on('unhandledRejection') handler — async failures can crash without terminal cleanup~~ DONE in #139

## Branch: fix/remove-dead-retryable-field

### Gate A

- Date: 2026-04-05
- Branch: fix/remove-dead-retryable-field
- Chosen issue: classifyError `retryable` field in tools/executor.ts computed in all return paths but never consumed
- Why it is next: Dead code removal. The `retryable` field was flagged in cycle 1 (deferred item). Only `.fatal` and `.message` are used by the caller. Removing it eliminates confusion about retry behavior and reduces code noise.
- Scope: Remove `retryable` from ClassifiedError interface and all return statements in classifyError (single file: src/chat/tools/executor.ts)
- Key files: src/chat/tools/executor.ts (lines 12-54)
- Agent plan: implementation → audit → PR → Karen → merge

### Implementation

- Commit: 0854d40
- Files: src/chat/tools/executor.ts (1 file, -11/+10)

### Hostile Audit / Gate B / PR / Karen / Merge

- Audit: ZERO FINDINGS (dead code removal, no consumers)
- PR #140: https://github.com/lemonadesocial/lemonade-cli/pull/140
- Karen: APPROVE, zero findings
- CI: all green
- Merged at: 2026-04-05, merge commit: 3ec8427
- Local main synced: yes

- Item: ~~Batch mode JSON output silent failure on streaming errors — no JSON error envelope emitted~~ DONE in #138

## Branch: fix/unhandled-rejection-handler

### Gate A

- Date: 2026-04-05
- Branch: fix/unhandled-rejection-handler
- Chosen issue: No `process.on('unhandledRejection')` handler — async failures can crash the process with no cleanup and no actionable error message
- Why it is next: Defensive safety net for all users. If a promise rejects without a .catch(), the process crashes silently. Adding a handler ensures: (1) actionable error logged to stderr, (2) process.exit(1) called, which triggers the terminal cleanup handler in terminal.ts if TTY mode is active.
- Scope: Add unhandledRejection + uncaughtException handlers in index.ts. Add unit tests.
- Key files:
  - src/chat/index.ts — register handlers before main()
- Backend/runtime facts: Node.js fires 'unhandledRejection' for unhandled promise rejections. process.on('exit') handlers (registered in terminal.ts:54) fire when process.exit() is called, ensuring terminal cleanup.
- Agent plan: implementation → audit → remediation → PR → Karen → final audit
- Discovery side-note: terminal corruption from early process.exit() was re-evaluated and found to be low risk (escape codes only written inside runTerminalUI, which has process.on('exit') cleanup registered)

### Implementation

- What was built: Extracted crashHandlers.ts with formatCrashMessage, handleUnhandledRejection, handleUncaughtException, registerCrashHandlers. Uses process.stderr.write (not chalk) for crash safety. Logs stack traces. 13 unit tests.
- Commit(s): f85c4ed (initial), f1a36e2 (audit remediation), c88628c (NIT fixes)
- Checks run: tsc --noEmit, vitest (952 tests pass), yarn build — all clean
- Files changed: src/chat/crashHandlers.ts (new), src/chat/index.ts, tests/unit/chat/crashHandlers.test.ts
- Durability: confirmed

### Hostile Audit

- Round 1: 2 MEDIUM, 1 HIGH, 2 LOW, 1 NIT. Key: mock-confirms-mock tests, unsafe err.message access, chalk in crash handlers, lost stack traces
- Round 2: 3 NIT only. Verdict: ZERO FINDINGS at medium+
- Remediation commits: f1a36e2 (all majors), c88628c (NITs)

### Gate B

- Status: PASS
- Files changed: src/chat/crashHandlers.ts (new), src/chat/index.ts, tests/unit/chat/crashHandlers.test.ts (3 files)
- Commits: f85c4ed, f1a36e2, c88628c
- Checks: tsc clean, build clean, 952 tests pass
- Residual risks: (1) registerCrashHandlers has no idempotency guard (single call site, acceptable)

### PR

- PR number: #139
- PR title: fix: add crash handlers for unhandled rejections and uncaught exceptions
- PR URL: https://github.com/lemonadesocial/lemonade-cli/pull/139
- Base: main
- Head: fix/unhandled-rejection-handler
- Commits: f85c4ed, f1a36e2, c88628c

### Karen Review

- Verdict: APPROVE
- Findings: 1 MINOR (ignored promise param), 2 NIT (duplicate formatters, no idempotency guard)
- No remediation needed — all acceptable

### Final Review / Merge

- Final zero-findings audit: PASS
- Merged at: 2026-04-05
- Merge commit: 5053227
- Local main synced: yes
- CI: all 3 checks green (lint, build, test)
- Remote branch deleted: yes

- Item: ~~safeErrorMessage duplicated 3 times across codebase (batch.ts, index.ts, handler.ts)~~ DONE in #141

## Branch: refactor/shared-safe-error-message

### Gate A → Merge (fast-track)

- Date: 2026-04-05
- Branch: refactor/shared-safe-error-message
- Issue: safeErrorMessage duplicated 3x across batch.ts, index.ts, handler.ts
- Scope: Extract to shared utility at src/chat/utils/errorMessages.ts
- Commit: dd8cda4
- Audit: ZERO FINDINGS
- PR #141: https://github.com/lemonadesocial/lemonade-cli/pull/141
- Karen: APPROVE, zero findings
- CI: all green
- Merged at: 2026-04-05, merge commit: 1c51834

- Item: ~~Terminal corruption on early main() failure~~ DEBUNKED: same as above — escape codes only written inside runTerminalUI, not before early exit points

- Item: JSON.parse() silent fallback in OpenAI provider (tool args become {})
- Why deferred: Discovered during #138 discovery, separate concern
- Suggested future branch: fix/openai-tool-parse-fallback

## Branch: fix/validate-mode-flag

### Gate A → Merge

- Date: 2026-04-05
- Branch: fix/validate-mode-flag
- Issue: --mode CLI flag undocumented in help text and silently ignores invalid values
- Scope: Add --mode to help, validate mode values, extract VALID_MODES/validateMode to dedicated module
- Commits: 7c6e601 (impl), 763c008 (audit remediation), 6b2c99e (barrel-import fix), 82be6f1 (Karen NIT)
- Files: src/chat/index.ts, src/chat/validation.ts (new), tests/unit/chat/modeValidation.test.ts (new)
- Audit: 2 rounds. Round 1: 2 MEDIUM (mock-confirms-mock, triple-defined modes), 2 LOW, 2 NIT. Round 2: 1 MEDIUM (barrel-file side effects), 2 LOW, 1 NIT. All fixed.
- PR #143: https://github.com/lemonadesocial/lemonade-cli/pull/143
- Karen: APPROVE, 1 NIT (return guard comment), fixed
- Final audit: ZERO FINDINGS
- CI: all green
- Merged at: 2026-04-05, merge commit: 5386e98

### Discovery side-findings (logged for future branches)

- ~~Batch mode JSON output format inconsistency~~ DONE in #144
- ~~Config `set` command: no help listing valid keys~~ DONE in #145
- Config `get` command: could also show valid keys in help text (parity with set, NIT from #145 audit)
- ~~Inconsistent error message styling: startup API key error missing chalk.red~~ DONE in #146
- Help text missing environment variable relationship documentation (low value)
- Config `get` command: could show valid/gettable keys in help text (NIT parity with #145)

---

## Branch: fix/batch-json-envelope-consistency

### Gate A → Merge

- Date: 2026-04-05
- Branch: fix/batch-json-envelope-consistency
- Issue: Batch mode JSON output uses ad-hoc format inconsistent with standard CLI envelope
- Scope: Use standard JsonEnvelope for batch mode success/error output, add compact option to helpers
- Commits: 101b6bb (impl), 534163f (Karen remediation — use shared helpers)
- Files: src/chat/batch.ts, src/output/json.ts, tests/unit/chat/batch.test.ts
- Audit: 1 round. 3 LOW, 1 NIT. Verdict: safe to continue.
- PR #144: https://github.com/lemonadesocial/lemonade-cli/pull/144
- Karen: APPROVE, 1 MED (use shared helpers), 1 LOW (single error code). MED fixed.
- Final audit: ZERO FINDINGS
- CI: all green
- Merged at: 2026-04-05, merge commit: 3b6f388

## Branch: fix/config-set-help-keys

### Gate A → Merge (fast-track)

- Date: 2026-04-05
- Branch: fix/config-set-help-keys
- Issue: `config set --help` doesn't list valid keys
- Scope: Add .addHelpText('after', ...) showing VALID_CONFIG_KEYS
- Commit: 808ab9b
- Files: src/commands/config/index.ts (1 file, 1 line added)
- Audit: ZERO FINDINGS (1 NIT: config get parity, deferred)
- PR #145: https://github.com/lemonadesocial/lemonade-cli/pull/145
- Karen: APPROVE, zero findings
- CI: all green
- Merged at: 2026-04-05, merge commit: b3bc60a

## Branch: fix/unstyled-api-key-error

### Gate A → Merge (fast-track)

- Date: 2026-04-05
- Branch: fix/unstyled-api-key-error
- Issue: "No AI API key found" error missing chalk.red styling and credits mode guidance
- Scope: 1 line in src/chat/index.ts
- Commit: 5244192
- Files: src/chat/index.ts (1 line)
- Audit: ZERO FINDINGS
- PR #146: https://github.com/lemonadesocial/lemonade-cli/pull/146
- Karen: APPROVE, zero findings
- CI: all green
- Merged at: 2026-04-05, merge commit: bee50c5

## Important Notes

- Contract limitations: Anthropic SDK has built-in maxRetries:2 for initial request failures, but mid-stream errors are NOT retried by the SDK
- Known backend dependencies: None — this is purely client-side
- Chat messages are in-memory only — NO disk persistence for conversation history
- Auth config (`~/.lemonade/config.json`) is the ONLY persistent user state
