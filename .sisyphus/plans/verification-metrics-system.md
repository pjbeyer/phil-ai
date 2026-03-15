# Cross-Plugin Verification & Metrics System

## TL;DR

> **Quick Summary**: Build a cross-plugin verification and metrics system that oversees all phil-ai plugins, implementing quality gates, event ingestion, metrics collection, pattern detection, drift analysis, PDCA loops, dashboard reporting, and Notion Hub sync — all as new modules in `shared/` with MCP tool access.
>
> **Deliverables**:
> - 4 new Zod schemas (events, gate, metrics, registry) in `shared/src/schemas/`
> - 7 new modules (ingestion, gates, metrics, patterns, drift, pdca, reporting) in `shared/src/`
> - 1 adapter module (git read-only) in `shared/src/adapters/`
> - 1 registry module in `shared/src/registry/`
> - 2 new MCP tool files (verification tools, verification hooks) in `mcp/src/tools/`
> - Notion Hub creation + sync module
> - Speckit integration with verification system
> - Comprehensive tests: 3 unit test suites + 1 integration test suite
>
> **Estimated Effort**: XL (21 tasks across 8 waves + final verification)
> **Parallel Execution**: YES — 8 waves, max 7 concurrent in Wave 5
> **Critical Path**: T1→T2→T5→T9→T10→T17→...→T21
> **Beads Epic**: pai-cee

---

## Context

### Original Request
Execute all 22 open bd issues under epic `pai-cee` "Cross-Plugin Verification & Metrics System". Issues are pre-defined with detailed descriptions, dependencies, and priorities.

### Research Findings
- **shared/src/**: Has schemas/ (8 files), storage/ (file-locked JSON/YAML), guide/, version/. NO events, gates, metrics, adapters, ingestion, patterns, drift, pdca, or reporting modules exist.
- **MCP server**: 5 tool files (workflow.ts is stub-only). Pattern: tool objects `{name, description, inputSchema, handler}`, exported as arrays, registered in `allTools` in `server.ts`.
- **Tests**: bun:test with coverage. Schema tests: positive/negative with `.parse()`/`.safeParse()`. Integration: `ENABLED` flag + `describe.skipIf`.
- **Storage**: XDG-compliant — `~/.local/share/phil-ai/` for data, `~/.config/phil-ai/` for config.
- **JSONL Format**: Real workflow events use `YYYY-MM-DD HH:MM:SS` dates (NOT ISO 8601), `work_finished` events lack `type` field.

### Metis Review
**Critical Gaps Addressed**:
- R2: JSONL date format mismatch → T1 must handle `YYYY-MM-DD HH:MM:SS` conversion, NOT use `z.string().datetime()`
- R3: Cross-module export registration → Every task includes barrel export update step
- R5: Empty data graceful degradation → All computation functions handle n=0 cases
- R7: `work_finished` missing `type` → Schema makes `type` optional

**Scorecard Dimensions**: [DECISION NEEDED: User must provide the exact 10+1 dimension names from Notion Scorecard Template]

---

## Work Objectives

### Core Objective
Build a verification and metrics meta-system that reads events from all phil-ai plugins, enforces quality gates, collects metrics, detects patterns/drift, runs PDCA reviews, and surfaces insights via MCP tools and Notion Hub.

### Concrete Deliverables
- `shared/src/schemas/events.ts` — SystemEvent, WorkflowEvent, LearningEvent, ContributionEvent, DocEvent schemas
- `shared/src/schemas/gate.ts` — GateEntry, GateDefinition, GateLogIndex schemas
- `shared/src/schemas/metrics.ts` — ScorecardEntry, MetricsSnapshot schemas
- `shared/src/schemas/registry.ts` — SystemRegistryEntry, RegistryConfig schemas
- `shared/src/registry/` — Registry loading, querying, validation
- `shared/src/ingestion/` — Multi-source event ingestion (workflow JSONL, learning, Notion)
- `shared/src/gates/` — Gate runner, gate log, built-in gates
- `shared/src/adapters/git.ts` — Read-only git state queries
- `shared/src/metrics/` — Duration tracking, velocity, scorecard aggregation
- `shared/src/patterns/` — Pattern detection engine (5 detectors)
- `shared/src/drift/` — Drift detection and cleanup sweep
- `shared/src/pdca/` — PDCA monthly review loop tooling
- `shared/src/reporting/` — Dashboard and reporting generation
- `shared/src/sync/notion.ts` — Notion Hub data sync
- `mcp/src/tools/verification.ts` — MCP tools: verify_workflow, workflow_metrics, gate_log
- `mcp/src/tools/hooks.ts` — MCP hooks: verify_before_start, verify_before_finish, work_status_enhanced, system_health
- `tests/unit/schemas/{events,gate,metrics}.test.ts` — Schema unit tests
- `tests/unit/ingestion/` — Ingestion unit tests
- `tests/unit/gates/` — Gate system unit tests
- `tests/unit/adapters/` — Git adapter unit tests
- `tests/unit/metrics/` — Metrics collection unit tests
- `tests/unit/patterns/` — Pattern detection unit tests
- `tests/unit/pdca/` — PDCA loop unit tests
- `tests/unit/drift/` — Drift detection unit tests
- `tests/integration/workflow/` — End-to-end workflow tests

### Definition of Done
- [ ] `bun test` passes with all new test files (0 failures)
- [ ] `bun run lint` passes with no errors
- [ ] `bun run build` completes successfully
- [ ] All 21 bd issues closed
- [ ] Epic pai-cee eligible for closure

### Must Have
- All 4 schema files with Zod validation following existing patterns
- Event ingestion from workflow JSONL files (real format, not idealized)
- Gate system with 3 built-in gates (work-start, work-finish, state-transition)
- Metrics collection with velocity and duration tracking
- All MCP tools registered and functional
- Unit tests for schemas, ingestion, gates, adapters
- Integration tests with ENABLED flag pattern

### Must NOT Have (Guardrails)
- **No new CLI commands** — this epic adds MCP tools only
- **No modification to external plugin repos** (phil-ai-learning, phil-ai-docs, etc.) — read-only integration
- **No `z.string().datetime()` for JSONL dates** — use custom Zod transform for `YYYY-MM-DD HH:MM:SS`
- **No `@phil-ai/shared/schemas` imports from MCP tools** — use `@phil-ai/shared` main entry
- **No `as any`, `@ts-ignore`, or empty catch blocks**
- **No Notion page creation without existence checks** — idempotency required
- **No "consider" items from pai-87v** — speckit Zod schemas for artifacts → separate future issue
- **No GitHub API integration for ContributionEvent** — define schema only, no actual ingestion
- **No parallel storage duplication** — read from original sources, index references only

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (bun:test with coverage)
- **Automated tests**: Tests-after (separate test issues: pai-sis, pai-jxw, pai-g1n, pai-870)
- **Framework**: bun:test
- **Pattern**: Positive/negative `.parse()`/`.safeParse()` for schemas; `TEST_DIR`/`getTestPath` for filesystem tests

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Schema tasks**: Use Bash (bun test) — Run schema tests, assert pass/fail
- **Module tasks**: Use Bash (bun REPL or test) — Import module, call functions, compare output
- **MCP tool tasks**: Use Bash (bun test) — Test tool handlers, assert response format
- **Notion tasks**: Use Bash (conditional) — RUN_NOTION_TESTS=true for Notion operations

### Cross-Cutting Verification (EVERY task)
```bash
bun run lint     # Must pass
bun run build    # Must pass
bun test         # Must pass (no regressions)
```

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — foundation schema):
└── T1: pai-3v5 — Define SystemEvent & WorkItem Schemas [deep]

Wave 2 (After Wave 1 — dependent schemas + registry, 3 PARALLEL):
├── T2: pai-buh — System Registry & Context Model [deep]
├── T3: pai-dk0 — Define Gate Schema [quick]
└── T4: pai-hbr — Define Metrics & Scorecard Schema [quick]

Wave 3 (After Wave 2 — core ingestion + schema tests, 2 PARALLEL):
├── T5: pai-kk8 — Implement Event Ingestion Layer [deep]
└── T6: pai-sis — Unit Tests — Schemas [unspecified-high]

Wave 4 (After Wave 3 — core systems, 3 PARALLEL):
├── T7: pai-68k — Git State Adapter (read-only) [quick]
├── T8: pai-lbf — Implement Gate System [deep]
└── T9: pai-940 — Implement Metrics Collection [deep]

Wave 5 (After Wave 4 — higher-level modules, 7 PARALLEL):
├── T10: pai-ajq — Drift Detection & Cleanup Sweep [deep]
├── T11: pai-c4f — Pattern Detection Engine [deep]
├── T12: pai-hr6 — PDCA Loop Tooling [deep]
├── T13: pai-kgq — Add Verification & Metrics MCP Tools [unspecified-high]
├── T14: pai-87v — Speckit Integration [unspecified-high]
├── T15: pai-qn6 — Implement Verification MCP Tool Hooks [deep]
└── T16: pai-jxw — Unit Tests — Ingestion, Gates & Adapters [unspecified-high]

Wave 6 (After Wave 5 — reporting + Notion + tests, 3 PARALLEL):
├── T17: pai-g1n — Unit Tests — Metrics, Patterns, PDCA & Drift [unspecified-high]
├── T18: pai-q0u — Dashboard & Reporting [deep]
└── T19: pai-d30 — Create Phil AI Notion Hub [unspecified-high]

Wave 7 (After Wave 6 — Notion sync):
└── T20: pai-k8q — Notion Sync — Phil AI Hub Data Flow [deep]

Wave 8 (After Wave 7 — E2E integration tests):
└── T21: pai-870 — Integration Tests — Workflow E2E [deep]

Wave FINAL (After ALL tasks — 4 parallel reviews):
├── F1: Plan compliance audit (oracle)
├── F2: Code quality review (unspecified-high)
├── F3: Real manual QA (unspecified-high)
└── F4: Scope fidelity check (deep)

Critical Path: T1 → T2 → T5 → T9 → T10 → T17 → T20 → T21 → F1-F4
Parallel Speedup: ~60% faster than sequential
Max Concurrent: 7 (Wave 5)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| T1 (pai-3v5) | — | T2,T3,T4,T5,T6 | 1 |
| T2 (pai-buh) | T1 | T5 | 2 |
| T3 (pai-dk0) | T1 | T6,T8 | 2 |
| T4 (pai-hbr) | T1 | T6,T9 | 2 |
| T5 (pai-kk8) | T1,T2 | T7,T8,T9,T15,T16 | 3 |
| T6 (pai-sis) | T1,T3,T4 | — | 3 |
| T7 (pai-68k) | T5 | T15,T16 | 4 |
| T8 (pai-lbf) | T3,T5 | T13,T14,T15,T16,T19 | 4 |
| T9 (pai-940) | T4,T5 | T10,T11,T12,T13,T14,T18,T19 | 4 |
| T10 (pai-ajq) | T9 | T17,T18 | 5 |
| T11 (pai-c4f) | T9 | T17,T18 | 5 |
| T12 (pai-hr6) | T9 | T17,T18 | 5 |
| T13 (pai-kgq) | T8,T9 | T19,T21 | 5 |
| T14 (pai-87v) | T8,T9 | — | 5 |
| T15 (pai-qn6) | T5,T7,T8 | T21 | 5 |
| T16 (pai-jxw) | T5,T7,T8 | — | 5 |
| T17 (pai-g1n) | T9,T10,T11,T12 | — | 6 |
| T18 (pai-q0u) | T9,T10,T11,T12 | T21 | 6 |
| T19 (pai-d30) | T8,T9,T13 | T20 | 6 |
| T20 (pai-k8q) | T8,T9,T19 | T21 | 7 |
| T21 (pai-870) | T13,T15,T18,T20 | — | 8 |

### Agent Dispatch Summary

| Wave | Tasks | Categories |
|------|-------|-----------|
| 1 | 1 | T1→`deep` |
| 2 | 3 | T2→`deep`, T3→`quick`, T4→`quick` |
| 3 | 2 | T5→`deep`, T6→`unspecified-high` |
| 4 | 3 | T7→`quick`, T8→`deep`, T9→`deep` |
| 5 | 7 | T10→`deep`, T11→`deep`, T12→`deep`, T13→`unspecified-high`, T14→`unspecified-high`, T15→`deep`, T16→`unspecified-high` |
| 6 | 3 | T17→`unspecified-high`, T18→`deep`, T19→`unspecified-high` |
| 7 | 1 | T20→`deep` |
| 8 | 1 | T21→`deep` |
| FINAL | 4 | F1→`oracle`, F2→`unspecified-high`, F3→`unspecified-high`, F4→`deep` |

---

## TODOs

### Wave 1 — Foundation Schema

- [ ] 1. Define SystemEvent & WorkItem Schemas (`pai-3v5`)

  **What to do**:
  - Create `shared/src/schemas/events.ts` with Zod schemas:
    - `SystemEventSchema`: base schema for cross-plugin events — `id` (UUID), `source` (system name from registry), `context` (work|personal|oss), `role` (maintainer|contributor|observer), `eventType` (string), `timestamp` (ISO 8601 — converted from source format), `metadata` (record)
    - `WorkflowEventSchema`: extends SystemEvent for workflow-specific events — `issueId`, `branch`, `profile`, `workType` (feature|bug|chore|refactor, OPTIONAL — absent on work_finished), `duration` (optional number)
    - `LearningEventSchema`: extends SystemEvent for learning capture/implementation
    - `ContributionEventSchema`: extends SystemEvent for contributor-role tracking (schema only, no GitHub ingestion)
    - `DocEventSchema`: extends SystemEvent for documentation lifecycle
  - Create JSONL parser function `parseWorkflowJsonl(line: string): WorkflowEvent` that converts `YYYY-MM-DD HH:MM:SS` dates to ISO 8601
  - Export all schemas, types, and factory functions from `shared/src/schemas/index.ts`
  - Add `export * from "./schemas/events.js"` to barrel

  **Must NOT do**:
  - Do NOT use `z.string().datetime()` for raw JSONL date fields — use a custom Zod transform or preprocessing step
  - Do NOT require `type` field on WorkflowEvent — it's optional (missing on `work_finished` events)
  - Do NOT implement actual GitHub API integration for ContributionEvent

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Schema design requires careful analysis of real JSONL format and cross-event type hierarchy
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - None — pure schema design needs no external tools

  **Parallelization**:
  - **Can Run In Parallel**: NO (foundation — everything depends on this)
  - **Parallel Group**: Wave 1 (solo)
  - **Blocks**: T2, T3, T4, T5, T6
  - **Blocked By**: None (can start immediately)

  **References**:
  **Pattern References**:
  - `shared/src/schemas/base.ts:5-27` — VersionedDataSchema pattern: Zod schema → exported type → factory function
  - `shared/src/schemas/state.ts:25` — Schema extension pattern using `.extend({})`
  - `shared/src/schemas/index.ts:1-85` — Barrel export pattern to follow

  **API/Type References**:
  - `shared/src/schemas/base.ts:5-9` — VersionedDataSchema (extend this for persistent events)
  - `shared/src/schemas/config.ts` — Enum pattern (Priority, ImpactLevel) for context/role enums

  **External References**:
  - Real JSONL format at `~/Projects/.workflow/metrics/` — events use `YYYY-MM-DD HH:MM:SS` dates, `work_finished` lacks `type` field
  - Sample: `{"event":"work_started","profile":"work","date":"2025-12-01 09:31:36","issue":"SEC-2040","branch":"feature/SEC-2040-...","type":"feature"}`

  **Acceptance Criteria**:
  - [ ] File exists: `shared/src/schemas/events.ts`
  - [ ] All 5 event schemas parse valid data without errors
  - [ ] `parseWorkflowJsonl()` converts real JSONL format correctly
  - [ ] Schemas re-exported from `shared/src/schemas/index.ts`
  - [ ] `bun run lint` passes
  - [ ] `bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Valid WorkflowEvent parsing from real JSONL
    Tool: Bash (bun eval)
    Preconditions: shared/src/schemas/events.ts exists with exports
    Steps:
      1. Run: bun eval 'import { parseWorkflowJsonl } from "./shared/src/schemas/events.ts"; const e = parseWorkflowJsonl(\'{ "event": "work_started", "profile": "work", "date": "2025-12-01 09:31:36", "issue": "SEC-2040", "branch": "feature/SEC-2040", "type": "feature" }\'); console.log(JSON.stringify(e))'
      2. Assert output contains ISO 8601 timestamp (not YYYY-MM-DD HH:MM:SS)
      3. Assert `type` field is present as "feature"
    Expected Result: Parsed event with converted timestamp and all fields intact
    Evidence: .sisyphus/evidence/task-1-workflow-event-parse.txt

  Scenario: WorkflowEvent without type field (work_finished)
    Tool: Bash (bun eval)
    Preconditions: Same as above
    Steps:
      1. Run: bun eval 'import { parseWorkflowJsonl } from "./shared/src/schemas/events.ts"; const e = parseWorkflowJsonl(\'{ "event": "work_finished", "profile": "work", "date": "2025-11-25 21:01:55", "issue": "SEC-2039", "branch": "docs/SEC-2039" }\'); console.log(JSON.stringify(e))'
      2. Assert parsing succeeds (no throw)
      3. Assert `type` field is undefined/absent
    Expected Result: Parsed event without type field, no validation error
    Evidence: .sisyphus/evidence/task-1-workflow-event-no-type.txt

  Scenario: Invalid event rejection
    Tool: Bash (bun eval)
    Steps:
      1. Run: bun eval 'import { SystemEventSchema } from "./shared/src/schemas/events.ts"; const r = SystemEventSchema.safeParse({ invalid: true }); console.log(r.success, r.error?.issues?.length)'
      2. Assert `r.success` is false
      3. Assert error issues count > 0
    Expected Result: safeParse returns success=false with validation errors
    Evidence: .sisyphus/evidence/task-1-invalid-event-rejection.txt
  ```

  **Commit**: YES (group with Wave 1)
  - Message: `feat(shared): add SystemEvent & WorkItem schemas`
  - Files: `shared/src/schemas/events.ts`, `shared/src/schemas/index.ts`
  - Pre-commit: `bun run lint && bun run build`

### Wave 2 — Dependent Schemas & Registry (3 PARALLEL)

- [ ] 2. System Registry & Context Model (`pai-buh`)

  **What to do**:
  - Create `shared/src/schemas/registry.ts` with Zod schemas:
    - `SystemRegistryEntrySchema`: name, type (git-repo|cli-plugin|notion-workspace|custom), role (maintainer|contributor|observer), context (work|personal|oss), adapter (jsonl|github|notion|git|custom), connection config (path, repo, databaseId, etc.), isolation level (open|strict), enabled flag, gate overrides
    - `RegistryConfigSchema`: array of SystemRegistryEntry
  - Create `shared/src/registry/` module:
    - `index.ts` — barrel exports
    - `loader.ts` — `loadRegistry()` reads from `~/.config/phil-ai/systems.yaml`, `getSystemsByContext(ctx)`, `getSystemsByRole(role)`, `validateRegistry()`
  - Register config path in `shared/src/storage/directories.ts`
  - Export schemas from `shared/src/schemas/index.ts`
  - Add `export * from "./registry/index.js"` to `shared/src/index.ts`

  **Must NOT do**:
  - Do NOT create new CLI commands for registry management
  - Do NOT hardcode system entries — registry is user-configurable via YAML

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Registry design requires understanding extensibility patterns and YAML config conventions
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T3, T4)
  - **Blocks**: T5
  - **Blocked By**: T1

  **References**:
  **Pattern References**:
  - `shared/src/guide/loader.ts` — Guide loading pattern (discover + parse + merge) — follow this for registry loading
  - `shared/src/guide/types.ts` — TypeScript interfaces pattern for module types
  - `shared/src/storage/directories.ts:9-15` — Path registration pattern (getConfigDir)
  - `shared/src/storage/yaml.ts` — YAML read/write with file locking

  **API/Type References**:
  - `shared/src/schemas/config.ts` — Enum pattern for registry entry types
  - `shared/src/schemas/base.ts:5-9` — VersionedDataSchema for persistent config

  **Acceptance Criteria**:
  - [ ] File exists: `shared/src/schemas/registry.ts`
  - [ ] File exists: `shared/src/registry/index.ts`, `shared/src/registry/loader.ts`
  - [ ] `loadRegistry()` reads from `~/.config/phil-ai/systems.yaml`
  - [ ] `getSystemsByContext('work')` filters correctly
  - [ ] `getSystemsByRole('maintainer')` filters correctly
  - [ ] `validateRegistry()` catches invalid entries
  - [ ] All exports registered in barrel files
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Load valid registry YAML
    Tool: Bash (bun eval)
    Preconditions: Create temp systems.yaml with 2 entries (one work/maintainer, one oss/contributor)
    Steps:
      1. Write temp YAML file with valid registry entries
      2. Run loadRegistry() pointing to temp file
      3. Assert returned array has length 2
      4. Assert getSystemsByContext('work') returns 1 entry
      5. Assert getSystemsByRole('contributor') returns 1 entry
    Expected Result: Registry loaded, filtered correctly
    Evidence: .sisyphus/evidence/task-2-registry-load.txt

  Scenario: Reject invalid registry entry
    Tool: Bash (bun eval)
    Steps:
      1. Call validateRegistry() with entry missing required 'name' field
      2. Assert validation fails with descriptive error
    Expected Result: Validation rejects with clear error message
    Evidence: .sisyphus/evidence/task-2-registry-invalid.txt
  ```

  **Commit**: YES (group with Wave 2)
  - Message: `feat(shared): add system registry & context model`
  - Files: `shared/src/schemas/registry.ts`, `shared/src/registry/**`, `shared/src/schemas/index.ts`, `shared/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

- [ ] 3. Define Gate Schema (`pai-dk0`)

  **What to do**:
  - Create `shared/src/schemas/gate.ts` with Zod schemas:
    - `GateEntrySchema`: gate name, date, executedBy (agent|manual|cli), result (pass|fail|blocked), reason, sourceItemId, sourceSystem (from registry), context (work|personal|oss), role (maintainer|contributor|observer), creditsUsed (optional number)
    - `GateDefinitionSchema`: name, description, evaluator function signature (as type, not runtime), severity (info|warning|critical), applicableRoles (which roles this gate applies to)
    - `GateLogIndexSchema`: with date sorting and context filtering — array of GateEntry references
  - Export all schemas, types, and enums from `shared/src/schemas/index.ts`

  **Must NOT do**:
  - Do NOT implement gate evaluation logic — just the schema
  - Do NOT create gate storage files — just the data shape

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward Zod schema definition following established patterns
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T2, T4)
  - **Blocks**: T6, T8
  - **Blocked By**: T1

  **References**:
  **Pattern References**:
  - `shared/src/schemas/base.ts:5-27` — Schema definition pattern
  - `shared/src/schemas/state.ts` — Enum definitions (LearningStatus) — follow for gate result enum
  - `shared/src/schemas/index.ts` — Barrel export pattern

  **Acceptance Criteria**:
  - [ ] File exists: `shared/src/schemas/gate.ts`
  - [ ] GateEntrySchema parses valid gate entries
  - [ ] GateDefinitionSchema parses valid gate definitions
  - [ ] GateLogIndexSchema parses valid log indexes
  - [ ] All exported from `shared/src/schemas/index.ts`
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Valid gate entry parsing
    Tool: Bash (bun eval)
    Steps:
      1. Import GateEntrySchema from shared
      2. Parse: { name: 'work-start-validation', date: '2026-03-14T10:00:00Z', executedBy: 'agent', result: 'pass', reason: 'All checks passed', sourceItemId: 'SEC-2040', sourceSystem: 'phil-ai-workflow', context: 'work', role: 'maintainer' }
      3. Assert parse succeeds
    Expected Result: Valid entry parsed without errors
    Evidence: .sisyphus/evidence/task-3-gate-entry-valid.txt

  Scenario: Invalid gate result rejected
    Tool: Bash (bun eval)
    Steps:
      1. SafeParse gate entry with result: 'maybe' (invalid enum value)
      2. Assert success is false
    Expected Result: Validation fails for invalid result enum
    Evidence: .sisyphus/evidence/task-3-gate-entry-invalid.txt
  ```

  **Commit**: YES (group with Wave 2)
  - Message: `feat(shared): add gate schema`
  - Files: `shared/src/schemas/gate.ts`, `shared/src/schemas/index.ts`
  - Pre-commit: `bun run lint && bun run build`

- [ ] 4. Define Metrics & Scorecard Schema (`pai-hbr`)

  **What to do**:
  - Create `shared/src/schemas/metrics.ts` with Zod schemas:
    - `ScorecardDimensionSchema`: score (z.number().min(1).max(5)), evidence (string), trend (up|down|stable)
    - `ScorecardEntrySchema`: date, context (work|personal|oss|aggregate), dimensions (z.record of ScorecardDimension), average (number), notes (optional string)
    - `MetricsSnapshotSchema`: period (string), context, velocity (items/week), avgDuration (number), gatePassRate (number 0-1), activeItems (number), completedItems (number)
  - [DECISION NEEDED]: The exact 10+1 scorecard dimension names must be provided by user. Define the schema structure generically with `z.record()` so any dimension names work, but document the expected dimensions.
  - Export all schemas, types from `shared/src/schemas/index.ts`

  **Must NOT do**:
  - Do NOT hardcode dimension names if user hasn't provided them — use `z.record()` for flexibility
  - Do NOT implement metrics computation — just the schema

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward Zod schema definition
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T2, T3)
  - **Blocks**: T6, T9
  - **Blocked By**: T1

  **References**:
  **Pattern References**:
  - `shared/src/schemas/base.ts:5-27` — Schema definition pattern
  - `shared/src/schemas/state.ts` — Complex schema with nested objects

  **Acceptance Criteria**:
  - [ ] File exists: `shared/src/schemas/metrics.ts`
  - [ ] ScorecardEntrySchema parses entries with arbitrary dimension names
  - [ ] Dimension scores constrained to 1-5 range
  - [ ] MetricsSnapshotSchema parses valid snapshots
  - [ ] All exported from `shared/src/schemas/index.ts`
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Valid scorecard with dimensions
    Tool: Bash (bun eval)
    Steps:
      1. Parse ScorecardEntry with dimensions: { velocity: { score: 4, evidence: 'items/week', trend: 'up' }, quality: { score: 3, evidence: 'gate pass rate', trend: 'stable' } }
      2. Assert parse succeeds
      3. Assert average is a number
    Expected Result: Scorecard with arbitrary dimensions parsed
    Evidence: .sisyphus/evidence/task-4-scorecard-valid.txt

  Scenario: Score out of range rejected
    Tool: Bash (bun eval)
    Steps:
      1. SafeParse dimension with score: 6 (above max 5)
      2. Assert success is false
    Expected Result: Score constraint enforced
    Evidence: .sisyphus/evidence/task-4-score-range.txt
  ```

  **Commit**: YES (group with Wave 2)
  - Message: `feat(shared): add metrics & scorecard schema`
  - Files: `shared/src/schemas/metrics.ts`, `shared/src/schemas/index.ts`
  - Pre-commit: `bun run lint && bun run build`

---

### Wave 3 — Core Ingestion + Schema Tests (2 PARALLEL)

- [ ] 5. Implement Event Ingestion Layer (`pai-kk8`)

  **What to do**:
  - Create `shared/src/ingestion/` module:
    - `index.ts` — barrel exports
    - `types.ts` — IngestOptions (dateRange), EventStoreIndex interface
    - `workflow.ts` — `ingestWorkflowEvents(dateRange?)`: read JSONL files from `~/Projects/.workflow/metrics/{profile}-{YYYY-MM}.json`, parse each line with `parseWorkflowJsonl()`, return `SystemEvent[]`
    - `learning.ts` — `ingestLearningEvents(dateRange?)`: read learning storage from `~/.local/share/phil-ai/`, parse learning capture/implementation events, return `SystemEvent[]`
    - `notion.ts` — `ingestNotionGates(dateRange?)`: stub that reads from Notion AI Gate Log via MCP tools (graceful degradation if unavailable), return `SystemEvent[]`
    - `all.ts` — `ingestAll(dateRange?)`: calls all ingestors, returns combined `SystemEvent[]`
    - `store.ts` — EventStore index at `~/.local/share/phil-ai/verification/events-index.json` (references only, source data stays in original locations). Use file locking from `shared/src/storage/lock.ts`
  - Register new data path `verification/` in `shared/src/storage/directories.ts`
  - Add `export * from "./ingestion/index.js"` to `shared/src/index.ts`
  - Handle graceful degradation: if Notion MCP unavailable, skip with warning; if learning storage empty, return empty array

  **Must NOT do**:
  - Do NOT duplicate source data — only store references/index
  - Do NOT require Notion access for non-Notion ingestion
  - Do NOT crash on empty directories or missing files

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Multi-source ingestion with file I/O, date parsing, graceful degradation requires careful implementation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T6)
  - **Blocks**: T7, T8, T9, T15, T16
  - **Blocked By**: T1, T2

  **References**:
  **Pattern References**:
  - `shared/src/guide/loader.ts` — File discovery and loading pattern (glob + parse + merge)
  - `shared/src/storage/json.ts` — File-locked JSON read/write pattern
  - `shared/src/storage/directories.ts` — Path registration for new data directories
  - `shared/src/storage/lock.ts` — File locking with `proper-lockfile`

  **API/Type References**:
  - `shared/src/schemas/events.ts` — SystemEvent, WorkflowEvent schemas (created in T1)
  - `shared/src/schemas/registry.ts` — SystemRegistryEntry for source identification (created in T2)

  **External References**:
  - Real JSONL data at `~/Projects/.workflow/metrics/work-2025-11.json` and similar — one JSON object per line
  - Profile names: `work`, `pjbeyer` (confirmed in data); `play`, `home` (mentioned in issues, no data yet)

  **Acceptance Criteria**:
  - [ ] Directory exists: `shared/src/ingestion/` with index.ts, workflow.ts, learning.ts, notion.ts, all.ts, store.ts
  - [ ] `ingestWorkflowEvents()` reads real JSONL files and returns SystemEvent[]
  - [ ] Empty directories return empty arrays (no crash)
  - [ ] Event store index persists to `~/.local/share/phil-ai/verification/events-index.json`
  - [ ] Notion ingestion gracefully degrades when unavailable
  - [ ] New path registered in `directories.ts`
  - [ ] Barrel exports added to `shared/src/index.ts`
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Ingest real workflow JSONL events
    Tool: Bash (bun eval)
    Preconditions: ~/Projects/.workflow/metrics/ contains JSONL files
    Steps:
      1. Import ingestWorkflowEvents from shared
      2. Call ingestWorkflowEvents() with no date filter
      3. Assert returned array length > 0
      4. Assert each event has ISO 8601 timestamp
      5. Assert each event has source, context, eventType fields
    Expected Result: Array of SystemEvent objects parsed from JSONL
    Evidence: .sisyphus/evidence/task-5-workflow-ingest.txt

  Scenario: Graceful handling of empty learning storage
    Tool: Bash (bun eval)
    Steps:
      1. Call ingestLearningEvents() when no learning data exists
      2. Assert returned array is empty (length 0)
      3. Assert no error thrown
    Expected Result: Empty array returned, no crash
    Evidence: .sisyphus/evidence/task-5-empty-learning.txt
  ```

  **Commit**: YES (group with Wave 3)
  - Message: `feat(shared): implement event ingestion layer`
  - Files: `shared/src/ingestion/**`, `shared/src/storage/directories.ts`, `shared/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

- [ ] 6. Unit Tests — Schemas (`pai-sis`)

  **What to do**:
  - Create test files following existing schema test pattern:
    - `tests/unit/schemas/events.test.ts` — SystemEvent, WorkflowEvent, LearningEvent, ContributionEvent, DocEvent (valid items, invalid types, missing required fields, date format conversion)
    - `tests/unit/schemas/gate.test.ts` — GateEntry (valid entries, invalid result enums, missing gates), GateDefinition, GateLogIndex
    - `tests/unit/schemas/metrics.test.ts` — ScorecardEntry (valid scorecard, dimension bounds 1-5, valid trends), MetricsSnapshot
  - Each test file: positive cases (minimal valid, full valid) + negative cases (invalid enum, missing required, out-of-range values)
  - Use `.parse()` for expected-valid, `.safeParse()` for expected-invalid (inspect error)
  - Follow pattern from `tests/unit/schemas/base.test.ts`

  **Must NOT do**:
  - Do NOT test implementation logic — only schema validation
  - Do NOT import from `@phil-ai/shared/schemas` — use `@phil-ai/shared`

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple test files with comprehensive positive/negative coverage
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T5)
  - **Blocks**: None
  - **Blocked By**: T1, T3, T4

  **References**:
  **Pattern References**:
  - `tests/unit/schemas/base.test.ts` — Schema validation test pattern (positive + negative cases)
  - `tests/unit/schemas/skill.test.ts` — Multiple test cases pattern (minimal/full definitions, rejection)

  **API/Type References**:
  - `shared/src/schemas/events.ts` — Event schemas to test (T1)
  - `shared/src/schemas/gate.ts` — Gate schemas to test (T3)
  - `shared/src/schemas/metrics.ts` — Metrics schemas to test (T4)

  **Acceptance Criteria**:
  - [ ] Files exist: `tests/unit/schemas/events.test.ts`, `gate.test.ts`, `metrics.test.ts`
  - [ ] `bun test tests/unit/schemas/events.test.ts` — PASS
  - [ ] `bun test tests/unit/schemas/gate.test.ts` — PASS
  - [ ] `bun test tests/unit/schemas/metrics.test.ts` — PASS
  - [ ] Each test file has ≥3 positive and ≥2 negative test cases

  **QA Scenarios:**
  ```
  Scenario: All schema tests pass
    Tool: Bash
    Steps:
      1. Run: bun test tests/unit/schemas/events.test.ts tests/unit/schemas/gate.test.ts tests/unit/schemas/metrics.test.ts
      2. Assert exit code 0
      3. Assert output shows all tests passing
    Expected Result: All tests pass with 0 failures
    Evidence: .sisyphus/evidence/task-6-schema-tests.txt
  ```

  **Commit**: YES (group with Wave 3)
  - Message: `test(shared): add schema tests for events, gates, metrics`
  - Files: `tests/unit/schemas/events.test.ts`, `tests/unit/schemas/gate.test.ts`, `tests/unit/schemas/metrics.test.ts`
  - Pre-commit: `bun test`

### Wave 4 — Core Systems (3 PARALLEL)

- [ ] 7. Git State Adapter — read-only (`pai-68k`)

  **What to do**:
  - Create `shared/src/adapters/git.ts` — READ-ONLY adapter that queries git state:
    - `getActiveBranches(profileDirs: string[])` → finds feature branches across profile directories
    - `getBranchAge(branch: string)` → days since last commit
    - `isMerged(branch: string, target: string)` → checks merge status
    - `getRecentCommits(branch: string, count: number)` → commit history
  - Create `shared/src/adapters/index.ts` barrel export
  - Uses `Bun.spawn()` or `child_process.exec` for git commands
  - Respects phil-ai-workflow's profile model: work, pjbeyer, play, home
  - Add `export * from "./adapters/index.js"` to `shared/src/index.ts`

  **Must NOT do**:
  - Do NOT create branches, commits, or PRs (read-only)
  - Do NOT modify git state in any way
  - Do NOT require specific git repos to exist — graceful degradation

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small focused module wrapping git CLI commands
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T8, T9)
  - **Blocks**: T15, T16
  - **Blocked By**: T5

  **References**:
  **Pattern References**:
  - `shared/src/guide/loader.ts` — Module structure pattern (types + implementation + barrel)

  **External References**:
  - phil-ai-workflow's `/work-status` logic — branch listing across profile directories
  - Profile directories: `~/Projects/work/`, `~/Projects/pjbeyer/`, `~/Projects/play/`, `~/Projects/home/`

  **Acceptance Criteria**:
  - [ ] File exists: `shared/src/adapters/git.ts`, `shared/src/adapters/index.ts`
  - [ ] `getActiveBranches()` returns branch list from current repo
  - [ ] `getBranchAge()` returns numeric days
  - [ ] `isMerged()` returns boolean
  - [ ] All git commands are read-only (no mutations)
  - [ ] Barrel exports added
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: List active branches
    Tool: Bash (bun eval)
    Steps:
      1. Import getActiveBranches from shared
      2. Call getActiveBranches([process.cwd()])
      3. Assert returned array contains at least 'main' or 'master'
    Expected Result: Array of branch names from current repo
    Evidence: .sisyphus/evidence/task-7-active-branches.txt

  Scenario: Branch age calculation
    Tool: Bash (bun eval)
    Steps:
      1. Call getBranchAge('main') on current repo
      2. Assert result is a non-negative number
    Expected Result: Numeric days since last commit
    Evidence: .sisyphus/evidence/task-7-branch-age.txt
  ```

  **Commit**: YES (group with Wave 4)
  - Message: `feat(shared): add read-only git state adapter`
  - Files: `shared/src/adapters/**`, `shared/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

- [ ] 8. Implement Gate System (`pai-lbf`)

  **What to do**:
  - Create `shared/src/gates/` module:
    - `index.ts` — barrel exports
    - `types.ts` — GateEvaluator type, GateRunResult interface
    - `runner.ts` — `GateRunner` class: register gates, evaluate a work item against registered gates, return pass/fail/blocked results
    - `log.ts` — `GateLog`: persist gate entries to `~/.local/share/phil-ai/verification/gates/{date}.json` using Gate Schema. Use file locking.
    - `builtin.ts` — Built-in gates:
      1. `work-start-validation` — title non-empty, type valid, no duplicate active items
      2. `work-finish-completeness` — item was in-progress, has actual duration
      3. `state-transition-validity` — only valid transitions (open→in-progress, in-progress→completed|blocked, blocked→in-progress)
  - Register data path `verification/gates/` in `directories.ts`
  - Add `export * from "./gates/index.js"` to `shared/src/index.ts`

  **Must NOT do**:
  - Do NOT implement Notion-style "All" and "Failures" views in code — that's for the dashboard (T18)
  - Do NOT add CLI commands for gates

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Gate evaluation logic requires careful state machine design and file-locked persistence
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T7, T9)
  - **Blocks**: T13, T14, T15, T16, T19
  - **Blocked By**: T3, T5

  **References**:
  **Pattern References**:
  - `shared/src/storage/json.ts` — File-locked JSON write pattern for gate log persistence
  - `shared/src/storage/lock.ts` — `withFileLock` for concurrent access protection
  - `shared/src/storage/directories.ts` — Register new data paths

  **API/Type References**:
  - `shared/src/schemas/gate.ts` — GateEntry, GateDefinition schemas (created in T3)
  - `shared/src/ingestion/` — EventStore for checking active items (created in T5)

  **Acceptance Criteria**:
  - [ ] Directory exists: `shared/src/gates/` with all files
  - [ ] GateRunner registers and evaluates gates
  - [ ] 3 built-in gates implemented and functional
  - [ ] GateLog persists entries to `verification/gates/{date}.json`
  - [ ] File locking used for gate log writes
  - [ ] Valid state transitions enforced (open→in-progress, etc.)
  - [ ] Invalid transitions rejected
  - [ ] Barrel exports added
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Gate runner evaluates work-start gate
    Tool: Bash (bun eval)
    Preconditions: GateRunner created with built-in gates registered
    Steps:
      1. Create GateRunner, register built-in gates
      2. Evaluate work-start-validation with valid item { title: 'Fix bug', type: 'bug' }
      3. Assert result is 'pass'
      4. Evaluate with empty title
      5. Assert result is 'fail'
    Expected Result: Gate passes for valid items, fails for invalid
    Evidence: .sisyphus/evidence/task-8-gate-runner.txt

  Scenario: State transition validation
    Tool: Bash (bun eval)
    Steps:
      1. Evaluate state-transition-validity for open→in-progress
      2. Assert 'pass'
      3. Evaluate for open→completed (invalid)
      4. Assert 'fail'
    Expected Result: Valid transitions pass, invalid fail
    Evidence: .sisyphus/evidence/task-8-state-transitions.txt
  ```

  **Commit**: YES (group with Wave 4)
  - Message: `feat(shared): implement gate system with 3 built-in gates`
  - Files: `shared/src/gates/**`, `shared/src/storage/directories.ts`, `shared/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

- [ ] 9. Implement Metrics Collection (`pai-940`)

  **What to do**:
  - Create `shared/src/metrics/` module:
    - `index.ts` — barrel exports
    - `types.ts` — MetricsOptions, VelocityWindow interfaces
    - `duration.ts` — calculate `actualDuration` from startedAt/completedAt pairs. Handle orphaned `work_started` events (no matching `work_finished`). Pair events by `issue` + `branch`.
    - `velocity.ts` — items completed per week over configurable rolling window (default 4 weeks). Handle n=0 and n<threshold cases (return 0 or null, not NaN).
    - `scorecard.ts` — compute scorecard dimensions from raw data. Use `z.record()` for flexible dimensions. Each dimension: derive score 1-5 from evidence.
    - `store.ts` — `MetricsStore`: persist snapshots to `~/.local/share/phil-ai/verification/metrics/{period}.json`. Use file locking. `queryMetrics(dateRange)` for trend analysis.
  - Register data path `verification/metrics/` in `directories.ts`
  - Add `export * from "./metrics/index.js"` to `shared/src/index.ts`
  - Handle empty data gracefully: velocity with 0 events = 0, not NaN/Infinity

  **Must NOT do**:
  - Do NOT produce NaN, Infinity, or divide-by-zero results
  - Do NOT require minimum data thresholds to return results — return sensible defaults for small datasets

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Mathematical calculations (velocity, duration) with edge cases and event pairing logic
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T7, T8)
  - **Blocks**: T10, T11, T12, T13, T14, T18, T19
  - **Blocked By**: T4, T5

  **References**:
  **Pattern References**:
  - `shared/src/storage/json.ts` — File-locked JSON write for metrics persistence
  - `shared/src/storage/directories.ts` — Data path registration

  **API/Type References**:
  - `shared/src/schemas/metrics.ts` — ScorecardEntry, MetricsSnapshot schemas (created in T4)
  - `shared/src/schemas/events.ts` — SystemEvent with timestamp for duration calculation (created in T1)
  - `shared/src/ingestion/` — ingestAll() to get events (created in T5)

  **Acceptance Criteria**:
  - [ ] Directory exists: `shared/src/metrics/` with all files
  - [ ] Duration calculation pairs work_started/work_finished by issue+branch
  - [ ] Orphaned work_started events handled (duration = null or now-startedAt)
  - [ ] Velocity: 0 events returns 0, not NaN
  - [ ] Scorecard aggregation produces valid ScorecardEntry
  - [ ] MetricsStore persists to `verification/metrics/{period}.json`
  - [ ] File locking on writes
  - [ ] Barrel exports added
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Duration calculation with paired events
    Tool: Bash (bun eval)
    Preconditions: Two SystemEvents (work_started + work_finished) for same issue
    Steps:
      1. Create work_started event at 2025-12-01T09:00:00Z
      2. Create work_finished event at 2025-12-01T17:00:00Z for same issue
      3. Calculate duration
      4. Assert duration is ~8 hours (480 minutes or 28800 seconds)
    Expected Result: Duration correctly calculated from event pairs
    Evidence: .sisyphus/evidence/task-9-duration-calc.txt

  Scenario: Velocity with zero events
    Tool: Bash (bun eval)
    Steps:
      1. Calculate velocity with empty event array, 4-week window
      2. Assert result is 0 (not NaN or Infinity)
    Expected Result: Zero velocity, no math errors
    Evidence: .sisyphus/evidence/task-9-velocity-zero.txt
  ```

  **Commit**: YES (group with Wave 4)
  - Message: `feat(shared): implement metrics collection with duration, velocity, scorecard`
  - Files: `shared/src/metrics/**`, `shared/src/storage/directories.ts`, `shared/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

---

### Wave 5 — Higher-Level Modules + MCP Tools (7 PARALLEL)

- [ ] 10. Drift Detection & Cleanup Sweep (`pai-ajq`)

  **What to do**:
  - Create `shared/src/drift/` module:
    - `index.ts` — barrel exports
    - `types.ts` — DriftReport, DriftEntry interfaces
    - `detectors/stale-work-items.ts` — branches in-progress >7 days without commits (reads git adapter, cross-refs with workflow metrics)
    - `detectors/orphaned-storage.ts` — files in dataDir not matching known schemas
    - `detectors/schema-staleness.ts` — data files with old _version
    - `detectors/unclosed-learnings.ts` — learnings captured but never implemented/closed
    - `detectors/unused-skills.ts` — skills installed but never invoked
    - `detectors/stale-documentation.ts` — docs not updated when related code changes
    - `detectors/context-divergence.ts` — AGENTS.md referencing deleted entities
    - `detectors/guide-violations.ts` — active preferences not followed
    - `sweep.ts` — `sweepAll()` runs all detectors, returns `DriftReport`
  - Add `export * from "./drift/index.js"` to `shared/src/index.ts`

  **Must NOT do**:
  - Do NOT modify or delete drifted files — detection only, report findings
  - Do NOT require all plugins to be installed — skip unavailable detectors

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: 8 detectors spanning multiple data sources with cross-referencing
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T11-T16)
  - **Blocks**: T17, T18
  - **Blocked By**: T9

  **References**:
  **API/Type References**:
  - `shared/src/adapters/git.ts` — Git state for stale branch detection (T7)
  - `shared/src/metrics/` — Metrics data for cross-referencing (T9)
  - `shared/src/ingestion/` — Event data for activity detection (T5)

  **Acceptance Criteria**:
  - [ ] All 8 detectors implemented
  - [ ] `sweepAll()` returns structured DriftReport
  - [ ] Unavailable detectors skipped gracefully
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Sweep detects orphaned storage files
    Tool: Bash (bun eval)
    Preconditions: Create temp data dir with a file not matching any schema
    Steps:
      1. Run orphaned-storage detector against temp dir
      2. Assert DriftEntry returned with file path
    Expected Result: Orphaned file detected and reported
    Evidence: .sisyphus/evidence/task-10-orphaned-storage.txt
  ```

  **Commit**: YES (group with Wave 5)
  - Message: `feat(shared): add drift detection & cleanup sweep`
  - Files: `shared/src/drift/**`, `shared/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

- [ ] 11. Pattern Detection Engine (`pai-c4f`)

  **What to do**:
  - Create `shared/src/patterns/` module:
    - `index.ts` — barrel exports
    - `types.ts` — PatternReport, PatternEntry (severity: info|warning|critical, suggestedAction)
    - `detectors/recurring-gate-failure.ts` — same gate fails 3+ times in rolling window
    - `detectors/velocity-anomaly.ts` — velocity drops >30% vs previous period
    - `detectors/type-concentration.ts` — >80% items same type
    - `detectors/duration-outlier.ts` — item duration >2 std devs from mean
    - `detectors/blocked-accumulation.ts` — growing count of blocked items
    - `engine.ts` — `PatternEngine`: run all detectors, return `PatternReport` with severity and suggested actions
  - Add `export * from "./patterns/index.js"` to `shared/src/index.ts`

  **Must NOT do**:
  - Do NOT persist pattern history — generate reports from current data only (history = v2)
  - Do NOT produce NaN/Infinity in statistical calculations

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Statistical analysis (std dev, rolling windows, thresholds)
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T10, T12-T16)
  - **Blocks**: T17, T18
  - **Blocked By**: T9

  **References**:
  **API/Type References**:
  - `shared/src/metrics/` — Velocity data, duration data for pattern analysis (T9)
  - `shared/src/gates/log.ts` — Gate log for recurring failure detection (T8)

  **Acceptance Criteria**:
  - [ ] All 5 detectors implemented
  - [ ] PatternEngine runs all detectors and returns PatternReport
  - [ ] Each detector handles empty/small datasets (no NaN)
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Velocity anomaly detection
    Tool: Bash (bun eval)
    Steps:
      1. Create metrics data: period1 velocity=5, period2 velocity=2 (60% drop)
      2. Run velocity-anomaly detector
      3. Assert PatternEntry returned with severity 'warning'
    Expected Result: Anomaly detected for >30% velocity drop
    Evidence: .sisyphus/evidence/task-11-velocity-anomaly.txt
  ```

  **Commit**: YES (group with Wave 5)
  - Message: `feat(shared): add pattern detection engine`
  - Files: `shared/src/patterns/**`, `shared/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

- [ ] 12. PDCA Loop Tooling (`pai-hr6`)

  **What to do**:
  - Create `shared/src/pdca/` module:
    - `index.ts` — barrel exports
    - `types.ts` — PDCAReview, Improvement interfaces
    - `review.ts` — `generateReview(period)`: aggregate metrics, identify top wins (highest velocity, most gates passed), top misses (failed gates, stale items, velocity drops), suggest one change for next month
    - `improvement.ts` — `trackImprovement(dimension, action, outcome)`: log what was changed and whether it helped
    - `prune.ts` — `pruneStale(threshold)`: identify items/artifacts not touched in N days
  - Add `export * from "./pdca/index.js"` to `shared/src/index.ts`

  **Must NOT do**:
  - Do NOT auto-apply improvements — only suggest and track

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Aggregation logic across multiple data sources with recommendation generation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T10, T11, T13-T16)
  - **Blocks**: T17, T18
  - **Blocked By**: T9

  **References**:
  **API/Type References**:
  - `shared/src/metrics/` — Velocity, duration, scorecard data (T9)
  - `shared/src/gates/log.ts` — Gate log for win/miss identification (T8)

  **Acceptance Criteria**:
  - [ ] `generateReview(period)` returns structured PDCAReview
  - [ ] Top wins and misses identified from real data
  - [ ] `trackImprovement()` persists improvement entries
  - [ ] `pruneStale(7)` identifies items older than 7 days
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Generate monthly review
    Tool: Bash (bun eval)
    Steps:
      1. Create fixture metrics/gate data for a period
      2. Call generateReview('2026-03')
      3. Assert review has wins, misses, and suggestion fields
    Expected Result: Structured review with at least 1 win, 1 miss, 1 suggestion
    Evidence: .sisyphus/evidence/task-12-pdca-review.txt
  ```

  **Commit**: YES (group with Wave 5)
  - Message: `feat(shared): add PDCA loop tooling`
  - Files: `shared/src/pdca/**`, `shared/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

- [ ] 13. Add Verification & Metrics MCP Tools (`pai-kgq`)

  **What to do**:
  - Create `mcp/src/tools/verification.ts` with 3 MCP tools:
    - `verify_workflow` — run all registered gates against current state, return aggregate results
    - `workflow_metrics` — return current scorecard data and velocity trends
    - `gate_log` — return gate execution history with optional filters (date range, result type, gate name)
  - Export as `verificationTools` array
  - Register in `mcp/src/server.ts` allTools: `import { verificationTools } from "./tools/verification.js"`, add `...verificationTools`
  - Update `mcp/src/index.ts` exports
  - Follow handler pattern from `mcp/src/tools/guide.ts` (most complex existing tool)

  **Must NOT do**:
  - Do NOT use `@phil-ai/shared/schemas` imports — use `@phil-ai/shared`
  - Do NOT throw errors from handlers — return error text in content

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: 3 MCP tools with integration to shared modules
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T10-T12, T14-T16)
  - **Blocks**: T19, T21
  - **Blocked By**: T8, T9

  **References**:
  **Pattern References**:
  - `mcp/src/tools/guide.ts:1-246` — Complex MCP tool pattern with @phil-ai/shared integration
  - `mcp/src/server.ts:14-20` — Tool registration in allTools array
  - `mcp/src/tools/workflow.ts` — Existing workflow tool stubs

  **API/Type References**:
  - `shared/src/gates/runner.ts` — GateRunner for verify_workflow (T8)
  - `shared/src/metrics/` — MetricsStore for workflow_metrics (T9)
  - `shared/src/gates/log.ts` — GateLog for gate_log (T8)

  **Acceptance Criteria**:
  - [ ] File exists: `mcp/src/tools/verification.ts`
  - [ ] 3 tools exported as `verificationTools` array
  - [ ] Tools registered in `mcp/src/server.ts` allTools
  - [ ] Each tool returns `{ content: [{ type: 'text', text: '...' }] }`
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: verify_workflow tool returns gate results
    Tool: Bash (bun eval)
    Steps:
      1. Import verificationTools from MCP tools
      2. Find verify_workflow tool
      3. Call handler with empty params
      4. Assert response has content array with text type
    Expected Result: Tool returns structured gate evaluation results
    Evidence: .sisyphus/evidence/task-13-verify-workflow.txt
  ```

  **Commit**: YES (group with Wave 5)
  - Message: `feat(mcp): add verification & metrics MCP tools`
  - Files: `mcp/src/tools/verification.ts`, `mcp/src/server.ts`, `mcp/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

- [ ] 14. Speckit Integration for Verification System (`pai-87v`)

  **What to do**:
  - Create integration points between speckit workflow and verification system:
    1. Feed `/speckit.analyze` results into Gate Log as gate entries — map CRITICAL/HIGH to fail, MEDIUM to blocked, LOW to pass
    2. Track speckit phase completion (specify→clarify→plan→tasks→implement) as SystemEvents for velocity metrics
    3. Use spec quality checklist pass/fail as a gate condition before implementation
    4. Feed speckit quality scores (80/100 code, 75/100 product) into Scorecard as dimensions
    5. Archive phase: track whether specs updated to match final implementation (detect spec-code drift)
  - Implementation location: `shared/src/integrations/speckit.ts` with barrel export
  - Add `export * from "./integrations/index.js"` to `shared/src/index.ts`

  **Must NOT do**:
  - Do NOT implement Zod schemas for speckit artifacts (spec.md, plan.md, tasks.md) — that's a separate future issue
  - Do NOT modify speckit commands/templates

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Integration mapping between two systems with clear data flow
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T10-T13, T15-T16)
  - **Blocks**: None
  - **Blocked By**: T8, T9

  **References**:
  **Pattern References**:
  - `.opencode/command/speckit.*.md` — Speckit command definitions (9 commands)
  - `.specify/` — Speckit templates and constitution
  - `specs/` — 3 completed features (examples of speckit output)

  **API/Type References**:
  - `shared/src/gates/runner.ts` — GateRunner for feeding gate entries (T8)
  - `shared/src/schemas/events.ts` — SystemEvent for phase tracking (T1)
  - `shared/src/metrics/scorecard.ts` — Scorecard for quality score integration (T9)

  **Acceptance Criteria**:
  - [ ] speckit analyze results map to gate entries correctly
  - [ ] Phase completion tracked as SystemEvents
  - [ ] Quality scores feed into scorecard dimensions
  - [ ] No speckit files modified
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Map speckit analysis to gate entries
    Tool: Bash (bun eval)
    Steps:
      1. Create mock speckit analysis result with CRITICAL finding
      2. Call mapping function
      3. Assert GateEntry created with result 'fail'
    Expected Result: CRITICAL maps to gate failure
    Evidence: .sisyphus/evidence/task-14-speckit-gate-map.txt
  ```

  **Commit**: YES (group with Wave 5)
  - Message: `feat(shared): add speckit integration for verification`
  - Files: `shared/src/integrations/**`, `shared/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

- [ ] 15. Implement Verification MCP Tool Hooks (`pai-qn6`)

  **What to do**:
  - Create `mcp/src/tools/hooks.ts` with 4 MCP tool hooks:
    - `verify_before_start` — gate check before starting work (validates no duplicate active items, checks stale branches)
    - `verify_before_finish` — gate check before finishing work (validates tests pass, lint clean, PR exists)
    - `work_status_enhanced` — extends phil-ai-workflow's status with metrics overlay (velocity, gate history, scorecard)
    - `system_health` — cross-plugin health check (all 5 plugins + Notion agents)
  - Export as `hookTools` array
  - Register in `mcp/src/server.ts` allTools
  - These hooks complement (not replace) phil-ai-workflow's work_start/work_finish

  **Must NOT do**:
  - Do NOT re-implement work_start/work_finish — those belong to phil-ai-workflow
  - Do NOT modify existing workflow tools

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Hook design requires understanding the boundary between verification hooks and workflow tools
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T10-T14, T16)
  - **Blocks**: T21
  - **Blocked By**: T5, T7, T8

  **References**:
  **Pattern References**:
  - `mcp/src/tools/workflow.ts` — Existing work_start/work_finish stubs (DO NOT replace)
  - `mcp/src/tools/guide.ts` — Complex tool handler pattern

  **API/Type References**:
  - `shared/src/gates/runner.ts` — GateRunner for pre-start/pre-finish checks (T8)
  - `shared/src/adapters/git.ts` — Git state for stale branch detection (T7)
  - `shared/src/metrics/` — Metrics overlay for enhanced status (T9)
  - `shared/src/ingestion/` — Event ingestion for system health check (T5)

  **Acceptance Criteria**:
  - [ ] File exists: `mcp/src/tools/hooks.ts`
  - [ ] 4 hook tools exported and registered
  - [ ] verify_before_start catches duplicate active items
  - [ ] verify_before_finish checks test/lint status
  - [ ] work_status_enhanced returns metrics overlay
  - [ ] system_health returns cross-plugin status
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: verify_before_start catches duplicates
    Tool: Bash (bun eval)
    Steps:
      1. Call verify_before_start with title matching an active item
      2. Assert gate result is 'fail' with reason mentioning duplicate
    Expected Result: Hook prevents duplicate work item creation
    Evidence: .sisyphus/evidence/task-15-verify-before-start.txt
  ```

  **Commit**: YES (group with Wave 5)
  - Message: `feat(mcp): add verification hook tools`
  - Files: `mcp/src/tools/hooks.ts`, `mcp/src/server.ts`, `mcp/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

- [ ] 16. Unit Tests — Ingestion, Gates & Adapters (`pai-jxw`)

  **What to do**:
  - Create test files:
    - `tests/unit/ingestion/workflow-events.test.ts` — parse JSONL, handle malformed entries, date range filtering, real JSONL format fixtures
    - `tests/unit/ingestion/learning-events.test.ts` — parse learning storage, handle empty storage
    - `tests/unit/gates/gate-system.test.ts` — each built-in gate, gate runner with mixed results, gate log persistence
    - `tests/unit/adapters/git.test.ts` — branch listing, age calculation, merge detection (mock git commands)
  - Use temp directories from `tests/setup.ts`
  - Include fixtures with sample JSONL data matching REAL format (`YYYY-MM-DD HH:MM:SS` dates)

  **Must NOT do**:
  - Do NOT use idealized ISO 8601 data in fixtures — use real JSONL format
  - Do NOT require real git repos — mock git commands

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple test files spanning 3 modules
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 5 (with T10-T15)
  - **Blocks**: None
  - **Blocked By**: T5, T7, T8

  **References**:
  **Pattern References**:
  - `tests/setup.ts` — TEST_DIR, getTestPath, beforeEach/afterEach cleanup
  - `tests/unit/storage/lock.test.ts` — File I/O test pattern with temp dirs
  - `tests/unit/schemas/base.test.ts` — Assertion pattern

  **API/Type References**:
  - `shared/src/ingestion/` — Module under test (T5)
  - `shared/src/gates/` — Module under test (T8)
  - `shared/src/adapters/git.ts` — Module under test (T7)

  **Acceptance Criteria**:
  - [ ] All 4 test files exist
  - [ ] `bun test tests/unit/ingestion/` passes
  - [ ] `bun test tests/unit/gates/` passes
  - [ ] `bun test tests/unit/adapters/` passes
  - [ ] JSONL test fixtures use real `YYYY-MM-DD HH:MM:SS` format
  - [ ] Gate tests cover all 3 built-in gates

  **QA Scenarios:**
  ```
  Scenario: All ingestion/gates/adapter tests pass
    Tool: Bash
    Steps:
      1. Run: bun test tests/unit/ingestion/ tests/unit/gates/ tests/unit/adapters/
      2. Assert exit code 0
    Expected Result: All tests pass
    Evidence: .sisyphus/evidence/task-16-unit-tests.txt
  ```

  **Commit**: YES (group with Wave 5)
  - Message: `test: add unit tests for ingestion, gates, adapters`
  - Files: `tests/unit/ingestion/**`, `tests/unit/gates/**`, `tests/unit/adapters/**`
  - Pre-commit: `bun test`

---

### Wave 6 — Reporting + Notion + Tests (3 PARALLEL)

- [ ] 17. Unit Tests — Metrics, Patterns, PDCA & Drift (`pai-g1n`)

  **What to do**:
  - Create test files:
    - `tests/unit/metrics/collection.test.ts` — duration calculation, velocity rolling window, scorecard dimension computation, n=0 edge cases
    - `tests/unit/patterns/detection.test.ts` — each detector with fixture data (recurring failures, velocity anomalies, duration outliers, type concentration, blocked accumulation)
    - `tests/unit/pdca/loop.test.ts` — review generation, improvement tracking, stale pruning
    - `tests/unit/drift/sweep.test.ts` — stale item detection, orphaned storage, schema version checking
  - Use test fixtures with known expected outputs
  - Ensure all math edge cases covered (division by zero, empty arrays)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with T18, T19)
  - **Blocks**: None
  - **Blocked By**: T9, T10, T11, T12

  **References**:
  **Pattern References**:
  - `tests/setup.ts` — TEST_DIR utilities
  - `tests/unit/storage/lock.test.ts` — File I/O test pattern

  **Acceptance Criteria**:
  - [ ] All 4 test files exist
  - [ ] `bun test tests/unit/metrics/ tests/unit/patterns/ tests/unit/pdca/ tests/unit/drift/` passes
  - [ ] Math edge cases tested (n=0, empty arrays)

  **QA Scenarios:**
  ```
  Scenario: All Wave 6 unit tests pass
    Tool: Bash
    Steps:
      1. Run: bun test tests/unit/metrics/ tests/unit/patterns/ tests/unit/pdca/ tests/unit/drift/
      2. Assert exit code 0
    Expected Result: All tests pass
    Evidence: .sisyphus/evidence/task-17-unit-tests.txt
  ```

  **Commit**: YES (group with Wave 6)
  - Message: `test: add unit tests for metrics, patterns, pdca, drift`
  - Files: `tests/unit/metrics/**`, `tests/unit/patterns/**`, `tests/unit/pdca/**`, `tests/unit/drift/**`
  - Pre-commit: `bun test`

- [ ] 18. Dashboard & Reporting (`pai-q0u`)

  **What to do**:
  - Create `shared/src/reporting/` module:
    - `index.ts` — barrel exports
    - `dashboard.ts` — `generateDashboard()`: combine velocity, gate pass rate, active items, recent patterns, drift alerts into structured report
    - `scorecard.ts` — `generateScorecard(period)`: compute all dimensions with evidence from real data
    - `trends.ts` — `trendReport(periods)`: compare metrics across multiple periods, include trend indicators (↑↗→↘↓)
  - Add MCP tool: `workflow_dashboard` in `mcp/src/tools/verification.ts` (append to existing verificationTools)
  - Output as structured JSON + formatted markdown
  - Add `export * from "./reporting/index.js"` to `shared/src/index.ts`

  **Must NOT do**:
  - Do NOT build a web UI — output is JSON and markdown only

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Data aggregation across all modules with dual output format
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with T17, T19)
  - **Blocks**: T21
  - **Blocked By**: T9, T10, T11, T12

  **References**:
  **API/Type References**:
  - `shared/src/metrics/` — Velocity, scorecard data (T9)
  - `shared/src/patterns/engine.ts` — Pattern detection results (T11)
  - `shared/src/drift/sweep.ts` — Drift report for alerts (T10)
  - `shared/src/gates/log.ts` — Gate pass rate data (T8)
  - `mcp/src/tools/verification.ts` — Add workflow_dashboard tool here (T13)

  **Acceptance Criteria**:
  - [ ] `generateDashboard()` returns structured report with all sections
  - [ ] `generateScorecard(period)` produces valid ScorecardEntry
  - [ ] `trendReport()` includes trend indicators
  - [ ] `workflow_dashboard` MCP tool registered and functional
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Dashboard generation with real data
    Tool: Bash (bun eval)
    Steps:
      1. Call generateDashboard()
      2. Assert report has velocity, gatePassRate, activeItems, patterns, driftAlerts sections
      3. Assert markdown output is non-empty string
    Expected Result: Complete dashboard with all sections
    Evidence: .sisyphus/evidence/task-18-dashboard.txt
  ```

  **Commit**: YES (group with Wave 6)
  - Message: `feat: add dashboard, reporting, and workflow_dashboard MCP tool`
  - Files: `shared/src/reporting/**`, `mcp/src/tools/verification.ts`, `shared/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

- [ ] 19. Create Phil AI Notion Hub (`pai-d30`)

  **What to do**:
  - Set up Phil AI Notion page hierarchy under parent page (https://www.notion.so/gettingsecuritydone/Phil-AI-0754676937f542e8a61d8b5033af6d78):
    1. **System Overview page** — what phil-ai governs, architecture diagram, monitored systems list
    2. **Gate Log database** — schema matching gate.ts fields: gate name, date, system source, executedBy, result, reason, credits. Views: All, Failures, By System
    3. **Scorecard database** — monthly entries with dimension columns, computed from real data
    4. **Dashboard page** — system health summary, velocity trends, active alerts, drift status
    5. **System Status sub-pages** — one per monitored system
  - Use Notion MCP tools for all operations
  - Implement idempotency: check for existing pages/databases before creating
  - Create `shared/src/notion/hub.ts` for page/database creation logic

  **Must NOT do**:
  - Do NOT create duplicate pages if hub already exists — check first
  - Do NOT mix Phil AI pages with Notion AI pages
  - Phil AI pages are SEPARATE from Notion AI — Notion AI is a MONITORED system

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Notion API operations with idempotency logic
  - **Skills**: [`notion-personal`]
    - `notion-personal`: Needed for Notion MCP operations (creating pages, databases)

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 6 (with T17, T18)
  - **Blocks**: T20
  - **Blocked By**: T8, T9, T13

  **References**:
  **External References**:
  - Phil AI Notion page: https://www.notion.so/gettingsecuritydone/Phil-AI-0754676937f542e8a61d8b5033af6d78
  - Notion MCP tools documentation

  **API/Type References**:
  - `shared/src/schemas/gate.ts` — Gate schema for Gate Log DB columns (T3)
  - `shared/src/schemas/metrics.ts` — Scorecard schema for Scorecard DB columns (T4)

  **Acceptance Criteria**:
  - [ ] Phil AI Notion Hub pages exist
  - [ ] Gate Log database created with correct schema
  - [ ] Scorecard database created with correct schema
  - [ ] Re-running does NOT create duplicates (idempotent)
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Notion Hub creation (conditional)
    Tool: Bash
    Preconditions: Notion MCP available, NOTION_ACCESS=true
    Steps:
      1. Run hub creation function
      2. Assert Phil AI parent page found
      3. Assert Gate Log and Scorecard databases exist
      4. Run again — assert no duplicates created
    Expected Result: Hub created idempotently
    Evidence: .sisyphus/evidence/task-19-notion-hub.txt
  ```

  **Commit**: YES (group with Wave 6)
  - Message: `feat: create Phil AI Notion Hub with Gate Log and Scorecard databases`
  - Files: `shared/src/notion/**`, `shared/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

### Wave 7 — Notion Sync

- [ ] 20. Notion Sync — Phil AI Hub Data Flow (`pai-k8q`)

  **What to do**:
  - Create `shared/src/sync/notion.ts` for maintaining Phil AI Notion Hub:
    - `syncGateLog(entries)` — push gate entries from ALL monitored systems to Notion Gate Log DB
    - `syncScorecard(entry)` — push monthly scorecard snapshot to Notion Scorecard DB
    - `syncDashboard(report)` — update dashboard page with system health, velocity trends, alerts, drift
    - `syncSystemStatus(system, status)` — update per-system health page
  - Direction: primarily push (code→Notion) with pull for manual scorecard adjustments
  - READS from Notion AI Gate Log (as monitored source) but WRITES only to Phil AI hub
  - Include conflict detection for concurrent updates
  - Use Notion MCP tools for all operations
  - Create `shared/src/sync/index.ts` barrel, add to `shared/src/index.ts`

  **Must NOT do**:
  - Do NOT write to Notion AI pages — only to Phil AI hub
  - Do NOT overwrite manual Notion edits without conflict detection

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Bi-directional sync with conflict detection across Notion workspaces
  - **Skills**: [`notion-personal`]
    - `notion-personal`: Required for Notion MCP read/write operations

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on T19 Notion Hub)
  - **Parallel Group**: Wave 7 (solo)
  - **Blocks**: T21
  - **Blocked By**: T8, T9, T19

  **References**:
  **API/Type References**:
  - `shared/src/notion/hub.ts` — Notion Hub page/database references (T19)
  - `shared/src/gates/log.ts` — GateLog entries to sync (T8)
  - `shared/src/metrics/scorecard.ts` — Scorecard entries to sync (T9)
  - `shared/src/reporting/dashboard.ts` — Dashboard report to push (T18)

  **Acceptance Criteria**:
  - [ ] `syncGateLog()` pushes entries to Notion Gate Log DB
  - [ ] `syncScorecard()` pushes to Notion Scorecard DB
  - [ ] `syncDashboard()` updates dashboard page
  - [ ] Conflict detection works for concurrent updates
  - [ ] Only writes to Phil AI hub (not Notion AI)
  - [ ] `bun run lint && bun run build` passes

  **QA Scenarios:**
  ```
  Scenario: Gate log sync (conditional)
    Tool: Bash
    Preconditions: Notion MCP available
    Steps:
      1. Create 3 test gate entries
      2. Call syncGateLog(entries)
      3. Query Notion Gate Log DB
      4. Assert 3 new entries exist
    Expected Result: Entries appear in Notion
    Evidence: .sisyphus/evidence/task-20-gate-sync.txt
  ```

  **Commit**: YES
  - Message: `feat(shared): implement Notion sync data flow`
  - Files: `shared/src/sync/**`, `shared/src/index.ts`
  - Pre-commit: `bun run lint && bun run build`

### Wave 8 — Integration Tests

- [ ] 21. Integration Tests — Workflow E2E (`pai-870`)

  **What to do**:
  - Create `tests/integration/workflow/` directory with E2E tests:
    1. Start→Status→Finish via MCP tools — verify gate log entries created
    2. Start→Block→Resume→Finish with state transition validation
    3. Multiple items → velocity calculation → scorecard generation
    4. Pattern detection with seeded anomaly data
    5. Drift sweep with intentionally stale/orphaned data
    6. PDCA review generation from real workflow data
    7. Notion sync round-trip (conditional: skip if no Notion credentials)
  - Use `ENABLED` flag pattern from `tests/integration/opencode/smoke.test.ts`
  - Use headless runner pattern for MCP tool invocation
  - Create test fixtures in `tests/integration/workflow/fixtures.ts`

  **Must NOT do**:
  - Do NOT require Notion credentials for non-Notion tests
  - Do NOT modify production data directories

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex E2E test scenarios spanning all modules with fixture management
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (final integration after everything)
  - **Parallel Group**: Wave 8 (solo)
  - **Blocks**: None (feeds into Final Verification)
  - **Blocked By**: T13, T15, T18, T20

  **References**:
  **Pattern References**:
  - `tests/integration/opencode/smoke.test.ts:5-7` — ENABLED flag pattern with describe.skipIf
  - `tests/integration/opencode/fixtures.ts` — TestFixture interface with cleanup()
  - `tests/integration/opencode/runner.ts` — Headless MCP tool runner
  - `tests/integration/opencode/assertions.ts` — Custom assertion helpers

  **API/Type References**:
  - All `shared/src/` modules (T1-T12, T14)
  - All `mcp/src/tools/` files (T13, T15)

  **Acceptance Criteria**:
  - [ ] `tests/integration/workflow/` directory exists with test files
  - [ ] `RUN_WORKFLOW_TESTS=true bun test tests/integration/workflow/` passes
  - [ ] All 7 test scenarios implemented
  - [ ] Notion tests conditional (skip without credentials)
  - [ ] Custom fixtures and assertion helpers created

  **QA Scenarios:**
  ```
  Scenario: Full E2E integration test suite
    Tool: Bash
    Steps:
      1. Run: RUN_WORKFLOW_TESTS=true bun test tests/integration/workflow/
      2. Assert exit code 0
      3. Assert all test scenarios pass
    Expected Result: All integration tests pass
    Evidence: .sisyphus/evidence/task-21-e2e-tests.txt
  ```

  **Commit**: YES
  - Message: `test: add workflow E2E integration tests`
  - Files: `tests/integration/workflow/**`
  - Pre-commit: `bun test`

---
## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan. Verify all 21 bd issues have been closed (`bd list --status=closed`). Check epic pai-cee eligibility.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `bun run build` + `bun run lint` + `bun test`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify all `.js` import extensions present. Check all new schemas re-exported from `shared/src/schemas/index.ts`. Check all new modules re-exported from `shared/src/index.ts`.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Tests [N pass/N fail] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high`
  Start from clean state. Execute EVERY QA scenario from EVERY task — follow exact steps, capture evidence. Test cross-task integration (gates + metrics + patterns working together). Test edge cases: empty data, invalid input, malformed JSONL. Save to `.sisyphus/evidence/final-qa/`.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (`git log`/`git diff`). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Verify no "consider" items from pai-87v were implemented. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Wave | Commit | Message | Pre-commit |
|------|--------|---------|------------|
| 1 | YES | `feat(shared): add SystemEvent & WorkItem schemas` | `bun test && bun run lint` |
| 2 | YES | `feat(shared): add gate, metrics, registry schemas` | `bun test && bun run lint` |
| 3 | YES | `feat(shared): implement event ingestion layer + schema tests` | `bun test && bun run lint` |
| 4 | YES | `feat(shared): implement gate system, metrics collection, git adapter` | `bun test && bun run lint` |
| 5 | YES | `feat: add verification modules, MCP tools, and unit tests` | `bun test && bun run lint && bun run build` |
| 6 | YES | `feat: add dashboard, reporting, Notion Hub, remaining tests` | `bun test && bun run lint && bun run build` |
| 7 | YES | `feat(shared): implement Notion sync data flow` | `bun test && bun run lint && bun run build` |
| 8 | YES | `test: add workflow E2E integration tests` | `bun test && bun run lint && bun run build` |

---

## Success Criteria

### Verification Commands
```bash
bun test                    # Expected: all tests pass, 0 failures
bun run lint                # Expected: no errors
bun run build               # Expected: successful build
bd list --status=open       # Expected: 0 issues under pai-cee (all closed)
bd stats                    # Expected: 22 closed issues (5 prior + 22 new - 5 = 22)
```

### Final Checklist
- [ ] All "Must Have" items present and verified
- [ ] All "Must NOT Have" items absent (no violations)
- [ ] All 21 tasks completed and bd issues closed
- [ ] Epic pai-cee closed
- [ ] All tests pass (unit + integration)
- [ ] Build and lint clean
- [ ] Evidence captured for all QA scenarios
