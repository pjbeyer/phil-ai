# Learnings — verification-metrics-system

## [2026-03-15] Session Start

### Codebase Conventions
- TypeScript strict mode, ES2022 target, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`
- Zod schemas: define schema → export inferred type → export factory function
- Barrel exports: `schemas/index.ts` re-exports all schemas; `shared/src/index.ts` re-exports all modules
- Import extensions: always use `.js` in imports (e.g., `"./schemas/events.js"`)
- No `as any`, `@ts-ignore`, or empty catch blocks
- File locking: use `shared/src/storage/lock.ts` with `withFileLock`
- Storage paths: XDG-compliant — `~/.local/share/phil-ai/` for data, `~/.config/phil-ai/` for config

### Critical JSONL Format
- Real workflow events use `YYYY-MM-DD HH:MM:SS` dates (NOT ISO 8601)
- `work_finished` events lack `type` field — make it optional
- Sample: `{"event":"work_started","profile":"work","date":"2025-12-01 09:31:36","issue":"SEC-2040","branch":"feature/SEC-2040-...","type":"feature"}`
- JSONL files at: `~/Projects/.workflow/metrics/{profile}-{YYYY-MM}.json`

### MCP Tool Pattern
- Tool objects: `{name, description, inputSchema, handler}`
- Exported as arrays (e.g., `verificationTools`)
- Registered in `mcp/src/server.ts` allTools
- Handlers return `{ content: [{ type: 'text', text: '...' }] }`
- Do NOT use `@phil-ai/shared/schemas` imports — use `@phil-ai/shared`

### Schema Extension Pattern
- Use `.extend({})` for schema inheritance (see `shared/src/schemas/state.ts:25`)
- Enum pattern: see `shared/src/schemas/config.ts` (Priority, ImpactLevel)

### Test Pattern
- Import from `bun:test`
- Use `.parse()` for expected-valid, `.safeParse()` for expected-invalid
- Temp dirs: use `TEST_DIR` and `getTestPath()` from `tests/setup.ts`
- Integration tests: use `ENABLED` flag with `describe.skipIf`

### Existing Modules
- `shared/src/schemas/`: base.ts, config.ts, guide.ts, index.ts, plugin.ts, skill.ts, state.ts, version.ts
- `shared/src/storage/`: directories.ts, json.ts, yaml.ts, lock.ts
- `shared/src/guide/`: loader.ts, types.ts
- `mcp/src/tools/`: context.ts, docs.ts, guide.ts, learning.ts, workflow.ts
- `tests/unit/`: generator/, guide/, schemas/, skills/, storage/, version/

## [2026-03-15] T1: Event Schemas + JSONL Parse

- Added `shared/src/schemas/events.ts` with `SystemEventSchema` base + workflow/learning/contribution/doc extensions via `.extend({})`.
- Kept `WorkflowEventSchema.workType` optional to support `work_finished` JSONL events that do not include `type`.
- Used `z.preprocess()` for raw JSONL `date` conversion (`YYYY-MM-DD HH:MM:SS` -> ISO 8601) before `.datetime()` validation.
- `parseWorkflowJsonl()` maps `event`/`issue`/`date` to `eventType`/`issueId`/`timestamp`, injects defaults (`source`, `context`, `role`), and validates final output with `WorkflowEventSchema.parse()`.

## [2026-03-15] T2: System Registry and Context Model

- Reused event enums (`EventContext`, `EventRole`) in `SystemRegistryEntrySchema` to keep registry context/role values aligned with event schema contracts.
- `loadRegistry()` should fail soft on missing file (empty array) but fail fast on invalid file shape/entries to surface user misconfiguration clearly.
- Entry-by-entry `safeParse` in `validateRegistry()` enables partial success (`valid`) while returning actionable per-entry error messages for invalid rows.
- Added `systems` to `ConfigPaths` so all config file locations remain centralized and XDG-compliant.

## 2026-03-15 - T5 Event ingestion layer
- Implemented `shared/src/ingestion/` with workflow, learning, notion stub, aggregate, store, and barrel exports.
- Workflow JSONL ingestion must tolerate malformed lines in real metrics (e.g., `type: fix/docs/test`) by warning and continuing.
- Learning ingestion works best by recursively scanning `~/.local/share/phil-ai/learnings/` and mapping a single learning record to multiple lifecycle events (`captured`, `implemented`, `closed`).
- Event index persistence target: `~/.local/share/phil-ai/verification/events-index.json`; requires new data path registration in `shared/src/storage/directories.ts`.

- T8 Gate System: Added `shared/src/gates` with `GateRunner`, `GateLog`, and built-in gates; avoided top-level export name collision with schema `GateContext` by not re-exporting the gate context type from `shared/src/gates/index.ts`.
- Gate log persistence uses per-day files at `verification/gates/YYYY-MM-DD.json` guarded by `withFileLock`, with pass-rate defaulting to `1.0` when no entries exist.


## [2026-03-15] T9: Metrics collection module

- Duration pairing is most robust as FIFO queues keyed by `issueId::branch`; it supports multiple start/finish cycles and clean orphan detection (`completedAt: null`, `durationHours: null`).
- Velocity should always guard zero/invalid windows; normalize to a positive week window and return `0` for empty result sets to avoid NaN/Infinity.
- Scorecard consistency can be derived from event cadence using interval coefficient-of-variation, then mapped into a 1-5 dimension score.
- Metrics snapshots fit naturally under `verification/metrics/{period}.json`; adding `verificationMetrics` to `DataPaths` keeps directory creation and storage access centralized.

## [2026-03-14] T10: Drift detection and sweep orchestration

- Implemented `shared/src/drift/` with detector isolation and a fault-tolerant `sweepAll()` aggregator that records per-detector run metadata instead of throwing.
- Graceful degradation works best with detector-level try/catch in `sweep.ts`; unavailable resources (e.g., missing paths/permissions) are marked `ran: false` while successful detectors still report findings.
- Schema drift detection can safely scan all JSON files by parsing opportunistically and only applying semver comparison when `_version` is present and valid.
- For now, usage-dependent detectors (`unused-skills`, `stale-documentation`, `context-divergence`, `guide-violations`) are intentionally stubbed to return empty arrays until activity/relationship signals are available.
- 2026-03-15T01:04:33.429496+00:00 — PDCA review quality improves when combining computed velocity/duration scorecard signals with gate-log stale detection, and always emitting fallback win/miss/suggestion keeps reports structurally valid under sparse telemetry.

## [2026-03-14] T11: Pattern detection engine

- Pattern detectors are safest when threshold preconditions are explicit (`n < 2`, empty arrays, non-finite values) and exit early before math, which prevents NaN/Infinity propagation under strict mode.
- `noUncheckedIndexedAccess` requires defensive checks in sliding-window logic; capturing `startTs`/`endTs` as guarded locals keeps rolling-window detectors type-safe without weakening compiler settings.
- A centralized `PatternEngine` wrapper with per-detector try/catch preserves partial results and provides deterministic detector health metadata (`ran`, `count`, `error`) even if one detector fails.

## [2026-03-14] T15: Verification MCP hooks

- Added `mcp/src/tools/hooks.ts` with focused hook tools (`verify_before_start`, `verify_before_finish`, `work_status_enhanced`, `system_health`) that complement existing workflow tools without replacing `work_start`/`work_finish`.
- `exactOptionalPropertyTypes` requires conditional object spreads when passing optional strings into gate context; explicit `undefined` values trigger type errors.
- Duplicate active-work detection can be derived from ingested workflow start/finish events by replaying event order into an active issue map.
- Hook handlers should never throw; wrapping shared API calls in try/catch and returning structured text keeps MCP interactions resilient.

## [2026-03-15] T18: Dashboard and reporting module

- Reporting functions should combine persisted snapshots with live fallbacks; using snapshot-first and event/gate fallback keeps dashboards useful when period snapshots are missing.
- Trend indicators are easiest to keep deterministic with explicit percentage bands (`>10`, `1-10`, `-1 to 1`, `-10 to -1`, `<-10`) and a `previous=0` special-case to avoid division errors.
- New MCP reporting tools should return one text payload containing machine-readable JSON plus markdown summary sections, and stay failure-safe with top-level try/catch.

## [2026-03-15] T17: Unit tests for metrics, patterns, PDCA, drift

- Duration outlier detection uses population stddev (not sample), so the outlier must be significantly beyond mean + 2*stddev when included in the calculation itself. Initial test with values [2, 3, 2.5, 3.5, 10] failed because 10 was barely below the threshold (10.086). Fixed by using more uniform base values and a much larger outlier (50h).
- `generateReview()` always calls `pruneStale(7)` internally even when data is injected — this reads from disk but gracefully returns empty when directories don't exist.
- `trackImprovement()` and `getImprovements()` write to `~/.local/share/phil-ai/verification/pdca/improvements.json` — tests that call these persist real data to the user's data directory (acceptable for integration-style tests).
- `sweepAll()` runs all 8 drift detectors; 4 are stubbed (unused-skills, stale-documentation, context-divergence, guide-violations) and always return empty arrays. The other 4 (stale-work-items, orphaned-storage, schema-staleness, unclosed-learnings) do real filesystem work.
- `detectOrphanedStorage()` and `detectSchemaStaleness()` accept a `dataDir` parameter, making them easy to test with temp directories. Other detectors use hardcoded paths from `getDataPaths()`.
- Pattern detectors all follow the same guard pattern: check preconditions (empty arrays, n < 2, non-finite values) and return `[]` early before any math.
- `blocked-accumulation` detector recognizes blocked events via three mechanisms: eventType containing "blocked", `metadata.blocked === true`, or `metadata.status === "blocked"`.
- All 89 new tests pass with 0 failures, 198 expect() calls across 4 test files.

## T19: Notion Hub Creation (2026-03-14)

### Notion MCP Patterns
- `notion-create-database` uses SQL DDL syntax for schema definition — very clean
- `notion-search` with `page_url` parameter scopes search to children of a page
- Database creation returns both database ID and data source ID (collection://) — need both
- Idempotency: search before create is essential since Notion doesn't prevent duplicates
- The `notion-create-pages` tool can batch multiple pages in one call (used for 5 system status pages)

### Code Patterns
- NotionClient interface abstracts away MCP vs API — allows testing without Notion
- Config stored at `~/.config/phil-ai/notion-hub.json` following existing directory conventions
- Hub functions are idempotent: check config file first, then search Notion, then create
- Barrel exports follow existing pattern: `shared/src/notion/index.ts` → `shared/src/index.ts`

### Gotchas
- Phil AI Scorecard page already existed (different purpose — monthly self-assessment) — don't confuse with Scorecard database
- SELECT options in DDL need color assignments for visual clarity in Notion UI
- Data source ID is different from database ID — both needed for querying

## [2026-03-15] T20: Notion sync data flow

- `NotionClient` currently exposes `searchPages`, `createPage`, and `createDatabase`; sync writes can stay idempotent by generating deterministic titles and calling `searchPages` before `createPage`.
- For dashboard/system status sync, preserving manual edits is safest by appending snapshot/status child pages under configured hub pages instead of replacing existing page content.
- `syncGateLog` batch behavior is easiest to validate with a mock in-memory client: first run creates entries, second run skips duplicates, proving idempotency without relying on live API writes.
- Notion hub verification via MCP `notion-fetch` confirmed expected IDs and data source links for Gate Log and Scorecard, which should stay in config for downstream query/write routing.

## [2026-03-15] T21: Workflow E2E integration tests

- `verify_before_start` and `work_status_enhanced` read real workflow metrics via `ingestWorkflowEvents()` hardcoded to `~/Projects/.workflow/metrics`, so integration tests should tolerate malformed legacy lines and avoid assuming an empty active-items set.
- To avoid writing gate artifacts into user data directories during integration tests, patch `GateLog.prototype` (`persist`, `getEntries`, `getPassRate`) with in-memory behavior and restore originals in `afterEach`.
- Drift scenario validation can stay safe by creating malformed JSON in a temp directory and asserting `detectOrphanedStorage(tempDir)` directly, while still executing `sweepAll()` to validate detector wiring.
- Notion round-trip is testable without credentials using a mock `NotionClient`: `getOrCreatePhilAiHub` + `syncGateLog`/`syncScorecard` proves idempotent create-then-skip behavior under `RUN_NOTION_TESTS=true`.
