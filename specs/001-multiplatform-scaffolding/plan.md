# Implementation Plan: Multi-Platform Phil-AI Scaffolding

**Branch**: `001-multiplatform-scaffolding` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-multiplatform-scaffolding/spec.md`

## Summary

Create unified scaffolding architecture that integrates four existing phil-ai plugins (learning, docs, context, workflow) into a cross-platform system supporting both Claude Code and OpenCode. The system provides a Bun-based CLI (`bunx phil-ai`) for installation and management, with platform-specific generators producing native plugin formats from shared core skill definitions.

## Technical Context

**Language/Version**: TypeScript 5.x (Bun 1.x runtime)  
**Primary Dependencies**: Bun (runtime + package manager), zod (schema validation)  
**Storage**: Human-readable files (JSON/YAML) at `~/.local/share/phil-ai/`, config at `~/.config/phil-ai/`  
**Testing**: Bun test (built-in test runner)  
**Target Platform**: macOS/Linux CLI + Claude Code plugins + OpenCode plugins  
**Project Type**: Multi-package monorepo  
**Performance Goals**: Installation <5 minutes, status check <10 seconds  
**Constraints**: No admin privileges required, user-space installation only, file locking for concurrent access  
**Scale/Scope**: Single user, 4 plugins, 2 platforms

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Hierarchy-First | PASS | Core skills at top level, platform plugins derived; no duplication |
| II. Token Efficiency | PASS | Platform generators produce optimized output; context loaded per-operation |
| III. Closed-Loop Learning | PASS | Documentation updated with spec before implementation |
| IV. Cross-Platform Compatibility | PASS | Core definitions → MCP → platform generators (per constitution architecture) |
| V. Version-Aware State | PASS | All stored data includes `_version`, `_created`, `_modified` metadata |

**Platform Compliance:**
| Platform | Compliance | Notes |
|----------|------------|-------|
| Claude Code | PASS | Follows `.claude-plugin/` + Markdown structure per constitution |
| OpenCode | PASS | TypeScript modules with Plugin export per constitution |
| MCP | PASS | Platform-agnostic, exposes core capabilities |

**Permission Strategy:** MCP-first approach per constitution Section "Permission Management". Bash scripts minimized; MCP tools preferred.

**Gate Result: PASSED** - Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```text
specs/001-multiplatform-scaffolding/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
phil-ai/
├── core/
│   └── skills/              # Platform-agnostic skill definitions (Agent Skills spec)
│       ├── learning/
│       ├── docs/
│       ├── context/
│       └── workflow/
├── mcp/
│   ├── src/
│   │   ├── server.ts        # MCP server entry point
│   │   ├── tools/           # MCP tool implementations
│   │   └── handlers/        # Request handlers
│   └── package.json
├── cli/
│   ├── src/
│   │   ├── index.ts         # CLI entry point (bunx phil-ai)
│   │   ├── commands/        # install, update, status, sync
│   │   └── lib/             # Shared utilities
│   └── package.json
├── platforms/
│   ├── claude-code/
│   │   ├── generator/       # Generates .claude-plugin/ structure
│   │   └── templates/       # Markdown templates for commands/skills
│   └── opencode/
│       ├── generator/       # Generates TypeScript plugin modules
│       └── templates/       # Plugin scaffolding templates
├── shared/
│   ├── schemas/             # Zod schemas for data validation
│   ├── storage/             # File storage with locking
│   └── version/             # Version metadata utilities
├── tests/
│   ├── setup.ts             # Bun test runner setup
│   ├── unit/
│   │   ├── schemas/         # Zod schema validation tests
│   │   ├── storage/         # File locking and I/O tests
│   │   ├── version/         # Version compatibility tests
│   │   └── skills/          # Core skill unit tests
│   ├── integration/
│   │   ├── install.test.ts  # Install command E2E
│   │   ├── status.test.ts   # Status command E2E
│   │   ├── claude-code.test.ts  # Claude Code plugin loading
│   │   ├── opencode.test.ts     # OpenCode plugin loading
│   │   └── cross-platform.test.ts  # State sharing tests
│   ├── snapshot/
│   │   ├── claude-code-generator.test.ts  # Generator output snapshots
│   │   └── opencode-generator.test.ts
│   └── contract/
│       ├── mcp-server.test.ts   # MCP protocol compliance
│       └── mcp-tools.test.ts    # Tool input/output contracts
├── package.json             # Root workspace config
├── bunfig.toml              # Bun configuration
└── tsconfig.json            # TypeScript config
```

**Structure Decision**: Multi-package monorepo with workspace support. Core skills are platform-agnostic; generators produce platform-native output. MCP server provides cross-platform access. CLI orchestrates installation and management.

**Plugin Output Strategy**: The `platforms/*/output/` directories contain **development output** for testing and local use. These generated plugins are intended to **replace** the existing separate repositories (`phil-ai-learning`, `phil-ai-docs`, `phil-ai-context`, `phil-ai-workflow`) over time. During transition:
- Existing repos remain functional for current users
- Generated output validates against existing plugin structure
- Once validated, generated plugins become the source of truth
- Existing repos may be archived or converted to thin wrappers pointing to this monorepo

## Complexity Tracking

No Constitution violations requiring justification. Architecture follows prescribed patterns.

## Phase Status

- [x] Phase 0: Research (generate research.md) - COMPLETED 2026-01-02
- [x] Phase 1: Design & Contracts (data-model.md, contracts/, quickstart.md) - COMPLETED 2026-01-02
- [x] Phase 2: Tasks (tasks.md - via /speckit.tasks) - COMPLETED 2026-01-02

## Constitution Re-Check (Post-Design)

*Re-evaluation after Phase 1 design completion*

| Principle | Status | Post-Design Evidence |
|-----------|--------|---------------------|
| I. Hierarchy-First | PASS | Data model defines clear hierarchy levels (global/profile/project/agent) |
| II. Token Efficiency | PASS | Generators produce minimal platform-specific output; shared schemas |
| III. Closed-Loop Learning | PASS | Learning entity includes status tracking and documentation paths |
| IV. Cross-Platform Compatibility | PASS | CLI contract defines platform-agnostic interface; generators handle translation |
| V. Version-Aware State | PASS | VersionedDataSchema ensures all entities include version metadata |

**Post-Design Gate Result: PASSED** - Ready for Phase 2 (Tasks)
