# Implementation Plan: Scaffold Command

**Branch**: `feat/002-scaffold-command` | **Date**: 2026-01-11 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-scaffold-command/spec.md`

## Summary

Add a `scaffold` command to the phil-ai CLI that generates OpenCode plugin scaffolding for existing Claude Code plugins. The command reads `.claude-plugin/plugin.json` metadata and generates `src/index.ts`, `package.json`, `tsconfig.json`, and a local plugin file at `.opencode/plugin/<name>.ts`. This enables plugin authors to support both platforms from a single codebase by running `bunx phil-ai scaffold`.

## Technical Context

**Language/Version**: TypeScript 5.x on Bun 1.x  
**Primary Dependencies**: Zod (validation), Bun (runtime, file I/O, glob)  
**Storage**: File system only (no database)  
**Testing**: Bun test runner with existing test infrastructure  
**Target Platform**: Cross-platform CLI (macOS, Linux, Windows via WSL)  
**Project Type**: Monorepo CLI command addition  
**Performance Goals**: < 5 seconds for typical plugin (SC-004)  
**Constraints**: Must follow existing CLI command patterns, templates from constitution  
**Scale/Scope**: Single command, 6-8 generated files per plugin

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| **I. Dual-Platform Native** | PASS | Commands defined once in markdown, plugin loads them at runtime |
| **II. Hierarchy-First** | PASS | No duplication - scaffold generates OpenCode support alongside existing Claude Code files |
| **III. Token Efficiency** | PASS | Generated plugin loads commands on demand, no verbose context |
| **IV. Version-Aware State** | N/A | No persistent state files generated |

**Gates Passed**: All principles satisfied. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/002-scaffold-command/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (CLI interface contract)
└── tasks.md             # Phase 2 output (NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
cli/src/commands/scaffold/
├── index.ts             # Command entry point (runScaffold)
├── schemas.ts           # Zod schemas (PluginManifest, CommandFrontmatter, SkillFrontmatter)
├── validate.ts          # Plugin validation (checkClaudeCodePlugin)
├── extract.ts           # Metadata extraction from plugin.json
├── generate.ts          # File content generation (plugin code, package.json, tsconfig)
├── templates.ts         # Template strings (from constitution)
├── render.ts            # Template rendering with substitutions
├── utils.ts             # Helper utilities (toPascalCase)
└── output.ts            # File writing with overwrite handling

tests/
├── unit/
│   └── scaffold/
│       ├── validate.test.ts
│       ├── extract.test.ts
│       ├── render.test.ts
│       └── templates.test.ts
└── integration/
    └── scaffold/
        └── scaffold.test.ts
```

**Structure Decision**: Single project structure. The scaffold command follows existing CLI patterns (`cli/src/commands/{name}/index.ts`). No new packages required.

## Complexity Tracking

No violations to justify. Design follows existing patterns with no additional complexity.

## Key Design Decisions

### 1. Template Source
Templates come directly from `constitution.md` (lines 206-366). The scaffold command embeds these as constants rather than reading from constitution at runtime.

### 2. File Generation Strategy
- Generate `src/index.ts` as canonical source
- Copy (not symlink) to `.opencode/plugin/<name>.ts`
- Generate `package.json`, `tsconfig.json` with metadata substitution
- Update `.gitignore` if needed
- Generate `.claude-plugin/marketplace.json` with `-dev` suffix for local testing

### 3. Validation Approach
Validate input before generation:
1. Check `.claude-plugin/plugin.json` exists
2. Verify required fields (name, version)
3. Warn if `commands/` missing
4. Proceed silently if `skills/` missing (optional)

### 4. Overwrite Behavior
- Default: Prompt for confirmation before overwriting existing files
- `--force`: Skip prompts, overwrite all
- `--dry-run`: Show what would be generated without writing

## Dependencies

### Existing Dependencies (no additions needed)
- `zod` - Already used for schema validation
- `bun:test` - Already configured
- `@phil-ai/shared` - For shared schemas

### New Internal Dependencies
- Reuse `cli/src/lib/args.ts` for flag parsing
- Reuse `cli/src/lib/output.ts` for console output
- Reuse `platforms/opencode/generator/render.ts` pattern for template rendering

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Template drift from OpenCode API | Medium | High | Pin @opencode-ai/plugin version in generated package.json |
| Plugin structure variations | Low | Medium | Validate strictly, fail fast with clear errors |
| Cross-platform file path issues | Low | Low | Use path.join consistently, test on Windows |

## Next Steps

After plan review:
1. Generate `research.md` - Consolidate OpenCode Plugin API details
2. Generate `data-model.md` - Define entities and transformations
3. Generate `contracts/` - CLI interface specification
4. Generate `quickstart.md` - Developer onboarding guide
5. Proceed to `/speckit.tasks` for task breakdown

## Post-Implementation Notes (2026-01-13)

### Implementation Completed
- **PR #237**: Initial implementation (37 tasks, merged)
- **PR #239**: Bug fixes discovered during real-world testing (3 issues)

### Deviations from Plan

**marketplace.json Schema**: The plan stated "Generate `.claude-plugin/marketplace.json` with `-dev` suffix for local testing" but didn't specify the complete schema. The initial implementation used a minimal template that failed validation. The fix (PR #239) added all required fields:
- Marketplace level: `description`, `owner` (name, email, url)
- Plugin level: `version`, `description`, `source` (as object), `author`, `license`

**Build Script**: The plan didn't specify the exact bun build flags. Initial implementation omitted `--format esm`, causing build failures. Fixed in PR #239.

**Testing Gap**: The plan's "Performance Goals: < 5 seconds for typical plugin (SC-004)" was met, but end-to-end testing with a real plugin wasn't performed until after merge. This would have caught all three bugs before initial release.

### Lessons for Future Features

1. **Explicit Schema Requirements**: When generating files validated by other commands, enumerate ALL required fields in the plan, not just reference patterns.

2. **End-to-End Testing**: Include at least one real-world test case (e.g., phil-ai-learning) in the acceptance criteria before marking feature complete.

3. **Generated Script Validation**: Any generated scripts (build, test, etc.) should be executed as part of acceptance testing, not just syntax-validated.

4. **Cross-Command Dependencies**: When one command generates files consumed by another (scaffold → validate), explicitly test the integration in the plan phase.
