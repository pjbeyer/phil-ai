# Task 4: Define Metrics & Scorecard Schema - COMPLETED

## Summary
Created `shared/src/schemas/metrics.ts` with complete Zod schemas for the metrics system.

## Deliverables

### File: `shared/src/schemas/metrics.ts`
- **ScorecardDimensionSchema**: Validates individual dimension scores (1-5), evidence, and trend
- **ScorecardEntrySchema**: Validates complete scorecard entries with flexible dimension names via `z.record()`
- **MetricsSnapshotSchema**: Validates metrics snapshots with velocity, duration, gate pass rate, and item counts
- **Enum exports**: ScorecardContext (work, personal, oss, aggregate), DimensionTrend (up, down, stable)
- **Type exports**: All inferred types (ScorecardDimension, ScorecardEntry, MetricsSnapshot)

### Barrel Export
Added complete export block to `shared/src/schemas/index.ts`:
```typescript
export {
  ScorecardDimensionSchema,
  ScorecardEntrySchema,
  MetricsSnapshotSchema,
  ScorecardContext,
  DimensionTrend,
  type ScorecardDimension,
  type ScorecardEntry,
  type MetricsSnapshot,
  type ScorecardContextType,
  type DimensionTrendType,
} from "./metrics.js";
```

## QA Evidence

### Test 1: Valid ScorecardEntry with Arbitrary Dimensions
- ✓ Parsed entry with 3 custom dimensions (code-quality, documentation, performance)
- ✓ Flexible dimension names work correctly with `z.record()`
- Evidence: `.sisyphus/evidence/task-4-scorecard-valid.txt`

### Test 2: Score Range Validation
- ✓ SafeParse correctly rejected dimension with score: 6 (exceeds max 5)
- ✓ Error message: "Number must be less than or equal to 5"
- Evidence: `.sisyphus/evidence/task-4-score-range.txt`

### Test 3: Valid MetricsSnapshot
- ✓ Parsed snapshot with all required fields
- ✓ Gate pass rate validation (0-1 range) works correctly
- Evidence: `.sisyphus/evidence/task-4-metrics-validation.txt`

## Build Status
✓ `bun run build` passes (all 5 packages)
✓ No TypeScript errors (lsp_diagnostics clean)
✓ All exports available from @phil-ai/shared

## Key Design Decisions
1. **Flexible dimensions**: Used `z.record(z.string(), ScorecardDimensionSchema)` to allow arbitrary dimension names
2. **ScorecardContext includes 'aggregate'**: Extended EventContext with aggregate context for cross-context metrics
3. **No computation logic**: Schema only validates structure, computation deferred to metrics service
4. **Strict validation**: Score range (1-5), gate pass rate (0-1), integer item counts

## Notes
- Follows established pattern from state.ts and gate.ts
- All imports use `.js` extensions (ES modules)
- Enum pattern matches existing schemas (const array + type inference)
