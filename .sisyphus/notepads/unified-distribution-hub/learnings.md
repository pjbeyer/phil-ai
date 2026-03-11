# Learnings — unified-distribution-hub

## [2026-03-11] Session Start

### Codebase State
- `platforms/opencode/generator/index.ts` — `generateAll()` at line 22-48. `ROOT_DIR` at line 10. `loadCoreSkills()` returns `LoadedSkill[]` with `skill: CoreSkill` (name, description) and `skillDir: string`.
- `cli/src/index.ts` — imports `runSync` (line 7) and `runUpdate` (line 8). Cases at lines 78-84. Help text at lines 26-27.
- `cli/src/commands/install/index.ts` — imports `registerClaudeCode` (line 6) and `registerOpenCode` (line 7). Conditional blocks at lines 60-68.
- No `registry.jsonc` exists yet at repo root.
- No `platforms/opencode/generator/registry.ts` exists yet.

### Key Types
- `LoadedSkill` interface: `{ skillDir: string, sourcePath: string, skill: CoreSkill }`
- `CoreSkill` has: `name`, `version`, `description`
- `SkillArtifact` has: `skillDir`, `skillMd`, `mcpJson`

### OCX Registry Format
- Required: `$schema`, `name`, `version`, `author`, `components[]`
- Component: `name`, `type` (enum: skill/agent/plugin/command/tool/bundle/profile), `description`, `files[]`
- NO `namespace` field — `additionalProperties: false`
- `$schema` URL: `https://ocx.kdco.dev/schemas/v2/registry.json`

### File Writing Convention
- Use `JSON.stringify(obj, null, '\t')` with trailing newline
- Write to `join(ROOT_DIR, 'registry.jsonc')`

### Wave Execution Plan
- Wave 1: Task 1 (registry generation) + Task 2 (CLI cleanup) — PARALLEL
- Wave 2: Task 3 (validate command) + Task 4 (docs) — PARALLEL, after Wave 1
- Final: F1-F4 review agents — PARALLEL, after Wave 2

## [2026-03-10] Documentation Update
- Updated README.md to reflect dual-distribution (Claude Code and OpenCode).
- Added `phil-ai-guide` plugin to the Plugins section.
- Replaced Installation section with `ocx` instructions for OpenCode.
- Removed stale `update` and `sync` CLI commands from README.md and AGENTS.md.
- Added `registry.jsonc` to the Architecture file tree in README.md.
- Updated Platform Strategy table to show `ocx add` from registry for OpenCode.
- Verified changes with `grep` and saved evidence to `.sisyphus/evidence/`.
