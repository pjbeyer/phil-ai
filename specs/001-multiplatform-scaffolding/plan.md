# Implementation Plan: Multi-Platform Phil-AI Scaffolding

**Branch**: `001-multiplatform-scaffolding` | **Date**: 2026-01-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-multiplatform-scaffolding/spec.md`

## Summary

Create infrastructure for cross-platform phil-ai system supporting Claude Code and OpenCode. External plugin repos (phil-ai-learning, phil-ai-docs, phil-ai-context, phil-ai-workflow) remain the source of truth. This monorepo provides: (1) CLI for installation and management (`bunx phil-ai`), (2) MCP server for platform-agnostic tool access, (3) shared schemas and utilities, (4) reference skill definitions for development/testing, and (5) marketplace.json generation for plugin discovery.

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

## Constitution Check (v2.0.1)

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Dual-Platform Native Support | PASS | External repos support both Claude Code and OpenCode natively; MCP provides platform-agnostic access |
| II. Hierarchy-First | PASS | Reference skills at `core/skills/`; no duplication between hierarchy levels |
| III. Token Efficiency | PASS | Context loaded per-operation; marketplace index enables selective plugin discovery |
| IV. Version-Aware State | PASS | All stored data includes `_version`, `_created`, `_modified` metadata |

**Architecture Compliance:**
| Component | Compliance | Notes |
|-----------|------------|-------|
| External Plugin Repos | SOURCE OF TRUTH | phil-ai-learning, phil-ai-docs, phil-ai-context, phil-ai-workflow |
| Monorepo | INFRASTRUCTURE | CLI, MCP server, shared utilities, marketplace index |
| Reference Skills | DEV/TEST ONLY | `core/skills/` for local development and testing |

**Permission Strategy:** MCP-first approach per constitution. Bash scripts minimized; MCP tools preferred.

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

**Structure Decision**: Multi-package monorepo providing infrastructure only. External plugin repos remain source of truth; this monorepo provides CLI, MCP server, shared utilities, and marketplace index.

**Architecture Strategy (Constitution v2.0.1)**:
- **External Plugin Repos**: Source of truth for both Claude Code and OpenCode plugin implementations
  - `phil-ai-learning`, `phil-ai-docs`, `phil-ai-context`, `phil-ai-workflow`
  - Each repo contains both platform formats (Claude Code markdown + OpenCode TypeScript)
- **This Monorepo**: Infrastructure only
  - `cli/`: Installation, status, scaffold, generate commands
  - `mcp/`: Platform-agnostic MCP server for tool access
  - `shared/`: Zod schemas, storage utilities, version management
  - `core/skills/`: Reference definitions for development/testing only
  - `.claude-plugin/marketplace.json`: Index pointing to external plugin repos
- **Scaffold Command (Feature 002)**: Adds OpenCode support to external plugin repos

## Complexity Tracking

No Constitution violations requiring justification. Architecture follows prescribed patterns.

## Phase Status

- [x] Phase 0: Research (generate research.md) - COMPLETED 2026-01-02
- [x] Phase 1: Design & Contracts (data-model.md, contracts/, quickstart.md) - COMPLETED 2026-01-02
- [x] Phase 2: Tasks (tasks.md - via /speckit.tasks) - COMPLETED 2026-01-02

## Constitution Re-Check (Post-Design, v2.0.1)

*Re-evaluation after Phase 1 design completion*

| Principle | Status | Post-Design Evidence |
|-----------|--------|---------------------|
| I. Dual-Platform Native Support | PASS | External repos provide both platform formats; MCP server platform-agnostic |
| II. Hierarchy-First | PASS | Data model defines clear hierarchy levels (global/profile/project/agent) |
| III. Token Efficiency | PASS | Marketplace index enables selective loading; reference skills for dev only |
| IV. Version-Aware State | PASS | VersionedDataSchema ensures all entities include version metadata |

**Post-Design Gate Result: PASSED** - Ready for Phase 2 (Tasks)
