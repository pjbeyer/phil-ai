# T16 Findings: Unit Tests for Ingestion, Gates & Adapters

## Key Discovery: GateContext Type Not Exported

The `GateContext` interface from `shared/src/gates/types.ts` is NOT re-exported from `@phil-ai/shared`. The `gates/index.ts` exports `GateEvaluator`, `GateRunResult`, `RegisteredGate` but omits `GateContext`. Meanwhile, `GateContext` (the enum array `["work", "personal", "oss"]`) IS exported from `schemas/gate.ts`, creating a naming collision.

**Workaround**: Used a local `TestGateContext` interface in the test file.
**Potential fix**: Export `GateContext` type from `gates/index.ts` with a renamed alias to avoid collision with the schema enum.

## JSONL Date Format

Real workflow JSONL uses `YYYY-MM-DD HH:MM:SS` format (e.g., `2025-12-01 09:31:36`). The `parseWorkflowJsonl` function uses `WorkflowJsonlTimestampSchema` with `z.preprocess()` to convert this to ISO 8601 (`2025-12-01T09:31:36.000Z`). Tests must use the real format, not idealized ISO 8601.

## Git Adapter Tests

All git adapter functions use `execSync` with graceful degradation (catch blocks returning defaults). Tests can safely use `process.cwd()` as the current repo is a valid git repo. No mocking needed.

## ingestLearningEvents Path Limitation

`ingestLearningEvents()` reads from `getDataPaths().learnings` which is a fixed system path. Can't easily test with temp directories without modifying source. Tests verify the function returns arrays and accepts options correctly.
