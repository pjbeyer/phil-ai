# Decisions — verification-metrics-system

## [2026-03-15] Session Start

### Architecture Decisions
- Scorecard dimensions: use `z.record()` for flexibility (user hasn't provided exact 10+1 names)
- ContributionEvent: schema only, no GitHub API integration
- Notion ingestion: graceful degradation stub (skip if unavailable)
- Event store: index references only, source data stays in original locations
- Pattern history: NOT persisted (generate from current data only — history is v2)
- PDCA improvements: suggest and track only, do NOT auto-apply

### Scope Boundaries
- NO new CLI commands — MCP tools only
- NO modification to external plugin repos (read-only integration)
- NO Notion page creation without existence checks (idempotency required)
- NO "consider" items from pai-87v (speckit Zod schemas for artifacts → separate future issue)
- NO GitHub API integration for ContributionEvent
- NO parallel storage duplication — read from original sources, index references only

## [2026-03-15] T2 Decisions

- Registry schema uses plain array config (`RegistryConfigSchema = z.array(SystemRegistryEntrySchema)`) to match `systems.yaml` as a user-managed list.
- Filtering helpers are intentionally pure (`getSystemsByContext`, `getSystemsByRole`) and only filter by requested dimension; they do not implicitly apply `enabled` gating.
- Validation path is split: `validateRegistry()` reports all entry-level issues, while `loadRegistry()` throws when any invalid entries exist to prevent partially trusted runtime config.
