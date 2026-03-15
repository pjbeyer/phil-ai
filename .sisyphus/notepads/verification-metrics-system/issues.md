# Issues & Gotchas — verification-metrics-system

## [2026-03-15] Session Start

### Known Gotchas
- JSONL dates are `YYYY-MM-DD HH:MM:SS` NOT ISO 8601 — must use custom Zod transform
- `work_finished` events lack `type` field — schema must make it optional
- Import paths must use `.js` extension even for `.ts` source files
- Do NOT use `@phil-ai/shared/schemas` — use `@phil-ai/shared` main entry
- Velocity with 0 events must return 0, not NaN/Infinity
- All computation functions must handle n=0 cases gracefully
