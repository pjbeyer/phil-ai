# Tasks: Multi-Platform Phil-AI Scaffolding

**Input**: Design documents from `/specs/001-multiplatform-scaffolding/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli.md

**Architecture Note (Constitution v2.0.1)**: External plugin repos are the source of truth. This monorepo provides infrastructure only: CLI, MCP server, shared utilities, and marketplace index. Reference skills in `core/skills/` are for development/testing only.

**Organization**: Tasks grouped by user story (P1-P4) for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Multi-package monorepo structure per plan.md:
- Root: `package.json`, `bunfig.toml`, `tsconfig.json`
- Packages: `cli/`, `mcp/`, `shared/`, `platforms/claude-code/`, `platforms/opencode/`
- Reference skills: `core/skills/`
- Tests: `tests/`

---

## Phase 1: Setup (Project Initialization)

**Purpose**: Create monorepo structure and shared configuration

- [x] T001 Create root package.json with Bun workspace config in package.json
- [x] T002 [P] Create bunfig.toml with Bun configuration in bunfig.toml
- [x] T003 [P] Create root tsconfig.json with TypeScript config in tsconfig.json
- [x] T004 [P] Create .gitignore with standard ignores in .gitignore
- [x] T005 Create cli package structure in cli/package.json
- [x] T006 [P] Create cli tsconfig in cli/tsconfig.json
- [x] T007 Create mcp package structure in mcp/package.json
- [x] T008 [P] Create mcp tsconfig in mcp/tsconfig.json
- [x] T009 Create shared package structure in shared/package.json
- [x] T010 [P] Create shared tsconfig in shared/tsconfig.json
- [x] T011 Create platforms/claude-code package in platforms/claude-code/package.json
- [x] T012 [P] Create platforms/opencode package in platforms/opencode/package.json
- [x] T013 Run `bun install` to link workspaces

**Checkpoint**: Monorepo structure ready - all packages linked via workspaces

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared schemas and utilities that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

### Zod Schemas (from data-model.md)

- [x] T014 [P] Create VersionedDataSchema base in shared/src/schemas/base.ts
- [x] T015 [P] Create ReferenceSkillSchema in shared/src/schemas/skill.ts
- [x] T016 [P] Create ExternalPluginSchema and MarketplaceIndexSchema in shared/src/schemas/plugin.ts
- [x] T017 [P] Create ConfigSchema in shared/src/schemas/config.ts
- [x] T018 [P] Create ComponentVersionSchema and VersionManifestSchema in shared/src/schemas/version.ts
- [x] T019 [P] Create LearningSchema and PatternSchema in shared/src/schemas/state.ts
- [x] T020 [P] Create StateIndexSchema in shared/src/schemas/state.ts
- [x] T021 Create schema index exporting all schemas in shared/src/schemas/index.ts

### Storage Layer (with file locking)

- [x] T022 Install proper-lockfile dependency in shared/package.json
- [x] T023 Create file locking utilities with retry/backoff in shared/src/storage/lock.ts
- [x] T024 Create JSON read/write with locking in shared/src/storage/json.ts
- [x] T025 Create YAML read/write with locking in shared/src/storage/yaml.ts
- [x] T026 Create directory management utilities in shared/src/storage/directories.ts
- [x] T027 Create storage index in shared/src/storage/index.ts

### Version Utilities

- [x] T028 Create version comparison utilities (semver) in shared/src/version/semver.ts
- [x] T029 Create version manifest read/write in shared/src/version/manifest.ts
- [x] T030 Create compatibility checker in shared/src/version/compatibility.ts
- [x] T031 Create version index in shared/src/version/index.ts

### Shared Package Entry Point

- [x] T032 Create shared package index exporting all modules in shared/src/index.ts

### Unit Tests (foundational)

- [x] T033 [P] Create test setup with Bun test runner in tests/setup.ts
- [x] T034 [P] Create schema unit tests for VersionedDataSchema in tests/unit/schemas/base.test.ts
- [x] T035 [P] Create schema unit tests for ReferenceSkillSchema in tests/unit/schemas/skill.test.ts
- [x] T036 [P] Create schema unit tests for ConfigSchema in tests/unit/schemas/config.test.ts
- [x] T037 [P] Create storage layer unit tests in tests/unit/storage/lock.test.ts
- [x] T038 [P] Create version utilities unit tests in tests/unit/version/compatibility.test.ts

### Reference Skill Definitions (for dev/testing)

- [x] T039 Create core/skills/ directory structure
- [x] T040 [P] Create learning reference skill in core/skills/learning/skill.json
- [x] T041 [P] Create learning SKILL.md in core/skills/learning/SKILL.md
- [x] T042 [P] Create docs reference skill in core/skills/docs/skill.json
- [x] T043 [P] Create docs SKILL.md in core/skills/docs/SKILL.md
- [x] T044 [P] Create context reference skill in core/skills/context/skill.json
- [x] T045 [P] Create context SKILL.md in core/skills/context/SKILL.md
- [x] T046 [P] Create workflow reference skill in core/skills/workflow/skill.json
- [x] T047 [P] Create workflow SKILL.md in core/skills/workflow/SKILL.md

### Reference Skill Unit Tests

- [x] T048 [P] Create learning skill unit tests in tests/unit/skills/learning.test.ts
- [x] T049 [P] Create docs skill unit tests in tests/unit/skills/docs.test.ts
- [x] T050 [P] Create context skill unit tests in tests/unit/skills/context.test.ts
- [x] T051 [P] Create workflow skill unit tests in tests/unit/skills/workflow.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Install Phil-AI System (Priority: P1)

**Goal**: Users can install phil-ai via `bunx phil-ai install` and have all components set up

**Independent Test**: Run `bunx phil-ai install` on clean machine, verify status reports healthy

### CLI Infrastructure

- [x] T052 [US1] Create CLI entry point with command router in cli/src/index.ts
- [x] T053 [US1] Create CLI argument parser in cli/src/lib/args.ts
- [x] T054 [US1] Create CLI output formatter (colors, tables) in cli/src/lib/output.ts
- [x] T055 [US1] Create CLI error handler with suggested fixes in cli/src/lib/errors.ts

### Install Command Implementation

- [x] T056 [US1] Create prerequisites checker (Bun version, disk space) in cli/src/commands/install/prerequisites.ts
- [x] T057 [US1] Create directory creator for ~/.local/share/phil-ai/ and ~/.config/phil-ai/ in cli/src/commands/install/directories.ts
- [x] T058 [US1] Create default config generator in cli/src/commands/install/config.ts
- [x] T059 [US1] Create version manifest initializer in cli/src/commands/install/version.ts
- [x] T060 [US1] Create install command orchestrator in cli/src/commands/install/index.ts
- [x] T061 [US1] Wire install command to CLI router in cli/src/index.ts
- [x] T062 [US1] Add --platforms, --force, --dry-run options per contracts/cli.md

### Platform Registration (Install Integration)

- [x] T063 [US1] Create Claude Code marketplace registration stub in cli/src/commands/install/platforms/claude-code.ts
- [x] T064 [US1] Create OpenCode config registration stub in cli/src/commands/install/platforms/opencode.ts
- [x] T065 [US1] Integrate platform registration into install flow in cli/src/commands/install/index.ts

**Checkpoint**: `bunx phil-ai install` creates directories, config, and reports success

---

## Phase 4: User Story 2 - Check System Health (Priority: P2)

**Goal**: Users can run `bunx phil-ai status` to see health of all components

**Independent Test**: Run `bunx phil-ai status` after install, verify component health displayed

### Health Check Infrastructure

- [x] T066 [US2] Create component health checker interface in cli/src/lib/health.ts
- [x] T067 [US2] Create storage health checker (directory writable, index readable) in cli/src/commands/status/checks/storage.ts
- [x] T068 [US2] Create version health checker (version.json valid) in cli/src/commands/status/checks/version.ts
- [x] T069 [US2] Create config health checker (config.yaml valid) in cli/src/commands/status/checks/config.ts

### Status Command Implementation

- [x] T070 [US2] Create status output formatter (text mode) in cli/src/commands/status/index.ts
- [x] T071 [US2] Create status output formatter (JSON mode) in cli/src/commands/status/index.ts
- [x] T072 [US2] Create status command orchestrator in cli/src/commands/status/index.ts
- [x] T073 [US2] Wire status command to CLI router in cli/src/index.ts
- [x] T074 [US2] Add --json, --verbose options per contracts/cli.md

### Suggested Fixes

- [x] T075 [US2] Create fix suggestion generator for common issues in cli/src/commands/status/suggestions.ts
- [x] T076 [US2] Integrate suggestions into unhealthy status output in cli/src/commands/status/index.ts

**Checkpoint**: `bunx phil-ai status` shows component health with actionable guidance

---

## Phase 5: User Story 3 - Use Phil-AI on Claude Code (Priority: P3)

**Goal**: Users can install 4 phil-ai plugins in Claude Code from marketplace index pointing to external repos

**Independent Test**: Add marketplace, verify 4 external plugin repos are listed and accessible

### Marketplace Generator

- [x] T077 [US3] Create external plugin metadata fetcher in platforms/claude-code/generator/index.ts
- [x] T078 [US3] Create marketplace.json schema validator in platforms/claude-code/generator/validate.ts
- [x] T079 [US3] Create marketplace.json generator in platforms/claude-code/generator/marketplace.ts
- [x] T080 [US3] Create output directory manager in platforms/claude-code/generator/output.ts

### Generate Command Implementation

- [x] T081 [US3] Create generate command in cli/src/commands/generate/index.ts
- [x] T082 [US3] Wire generate command to CLI router in cli/src/index.ts
- [x] T083 [US3] Add --output, --validate options per contracts/cli.md

### Marketplace Output

- [x] T084 [US3] Generate marketplace.json with 4 external plugin references in .claude-plugin/marketplace.json
- [x] T085 [US3] Add marketplace generation to install flow in cli/src/commands/install/index.ts

### Install Integration (Claude Code)

- [x] T086 [US3] Implement full Claude Code registration in cli/src/commands/install/platforms/claude-code.ts

**Checkpoint**: Claude Code marketplace index generated, points to 4 external repos

---

## Phase 6: User Story 4 - Use Phil-AI on OpenCode (Priority: P4)

**Goal**: Users can use phil-ai MCP server on OpenCode with same functionality as Claude Code

**Independent Test**: Start MCP server, verify tools are accessible via stdio

### MCP Server Infrastructure

- [x] T087 [US4] Install @modelcontextprotocol/sdk dependency in mcp/package.json
- [x] T088 [US4] Create MCP server entry point with stdio transport in mcp/src/server.ts
- [x] T089 [US4] Create MCP tool registration framework in mcp/src/index.ts

### MCP Tool Implementations

- [x] T090 [P] [US4] Create learning tools (capture-learning, list-learnings) in mcp/src/tools/learning.ts
- [x] T091 [P] [US4] Create docs tools (generate, optimize) in mcp/src/tools/docs.ts
- [x] T092 [P] [US4] Create context tools (optimize-agents, add-task) in mcp/src/tools/context.ts
- [x] T093 [P] [US4] Create workflow tools (work-start, work-finish) in mcp/src/tools/workflow.ts

### MCP Server Entry

- [x] T094 [US4] Create MCP server bin entry in mcp/package.json
- [x] T095 [US4] Add MCP server start to install flow in cli/src/commands/install/index.ts

### Install Integration (OpenCode)

- [x] T096 [US4] Implement full OpenCode registration in cli/src/commands/install/platforms/opencode.ts

**Checkpoint**: OpenCode MCP server running with all tools, feature parity with Claude Code

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Additional CLI commands, documentation, validation

### Additional CLI Commands

- [x] T097 Create update command with backup in cli/src/commands/update/index.ts
- [x] T098 Create data backup utility for updates (FR-010) in cli/src/commands/update/backup.ts
- [x] T099 Create data migration runner for updates (FR-010) in cli/src/commands/update/migrate.ts
- [x] T100 Create sync command in cli/src/commands/sync/index.ts
- [x] T101 Create validate command in cli/src/commands/validate/index.ts
- [x] T102 Wire update, sync, validate to CLI router in cli/src/index.ts

### Documentation

- [x] T103 Update root README.md with installation instructions
- [x] T104 [P] Create CLI usage documentation in docs/cli.md
- [x] T105 [P] Create architecture overview in docs/architecture.md

### Final Validation

- [x] T106 Run quickstart.md validation - verify all steps work
- [x] T107 Verify SC-001: Installation under 5 minutes
- [x] T108 Verify SC-002: Status check under 10 seconds (0.249s actual)
- [x] T109 Verify SC-003: Marketplace correctly references 4 external repos
- [x] T110 Verify SC-007: MCP server exposes tools accessible from both platforms
- [x] T111 Verify FR-009: Installation completes without sudo/admin privileges
- [x] T112 Verify SC-004: State written by one platform is readable by the other (cross-platform access)

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
     │
     ▼
Phase 2 (Foundational) ──── BLOCKS ALL USER STORIES
     │
     ├──────────────────────────────────────┐
     ▼                                      ▼
Phase 3 (US1: Install)              Phase 4 (US2: Status)*
     │                                      │
     ▼                                      │
Phase 5 (US3: Claude Code)                  │
     │                                      │
     ▼                                      │
Phase 6 (US4: OpenCode)                     │
     │                                      │
     └──────────────────────────────────────┘
                      │
                      ▼
              Phase 7 (Polish)
```

*US2 (Status) can start after Foundational but benefits from US1 completion for full health checks

### User Story Dependencies

| Story | Depends On | Can Parallel With |
|-------|------------|-------------------|
| US1 (Install) | Foundational only | - |
| US2 (Status) | Foundational, benefits from US1 | US1 |
| US3 (Claude Code) | US1 (for registration) | US4 |
| US4 (OpenCode) | US1 (for registration) | US3 |

### Parallel Opportunities

**Within Phase 1 (Setup)**:
```
T002, T003, T004 can run in parallel
T006, T008, T010, T012 can run in parallel
```

**Within Phase 2 (Foundational)**:
```
T014-T020 (schemas) can all run in parallel
T033-T038 (unit tests) can all run in parallel
T040-T047 (reference skills) can all run in parallel
T048-T051 (skill unit tests) can all run in parallel
```

**Within Phase 6 (US4)**:
```
T090-T093 (MCP tools) can run in parallel after T089
```

**Within Phase 7 (Polish)**:
```
T104-T105 (docs) can run in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T013)
2. Complete Phase 2: Foundational (T014-T051)
3. Complete Phase 3: US1 Install (T052-T065)
4. **STOP and VALIDATE**: `bunx phil-ai install` works
5. Can demo installation flow

### Incremental Delivery

| Milestone | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 | Users can install system |
| v0.2 | US1 + US2 | Users can verify health |
| v0.3 | US1 + US2 + US3 | Claude Code users have marketplace |
| v1.0 | All stories | Full cross-platform support with MCP |

### Suggested Execution

**Solo Developer**:
1. Setup -> Foundational -> US1 -> US2 -> US3 -> US4 -> Polish

**Two Developers**:
1. Dev A: Setup + Foundational (together)
2. After Foundational:
   - Dev A: US1 -> US3
   - Dev B: US2 -> US4
3. Polish together

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label = maps task to specific user story (US1-US4)
- Each user story is independently testable after completion
- External plugin repos (phil-ai-learning, etc.) are the source of truth
- Generators produce marketplace.json index, not full plugins
- MCP server provides platform-agnostic tool access
- Commit after each task or logical group
- Foundational phase is critical - blocks all user stories
