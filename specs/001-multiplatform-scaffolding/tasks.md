# Tasks: Multi-Platform Phil-AI Scaffolding

**Input**: Design documents from `/specs/001-multiplatform-scaffolding/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli.md

**Tests**: Included per constitution requirements (Section: Testing Requirements, lines 449-454).

**Organization**: Tasks grouped by user story (P1-P4) for independent implementation and testing.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Multi-package monorepo structure per plan.md:
- Root: `package.json`, `bunfig.toml`, `tsconfig.json`
- Packages: `cli/`, `mcp/`, `shared/`, `platforms/claude-code/`, `platforms/opencode/`
- Core skills: `core/skills/`
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

- [x] T014 [P] Create VersionedDataSchema base in shared/schemas/base.ts
- [x] T015 [P] Create CoreSkillSchema in shared/schemas/skill.ts
- [x] T016 [P] Create PlatformPluginSchema in shared/schemas/plugin.ts
- [x] T017 [P] Create ConfigSchema in shared/schemas/config.ts
- [x] T018 [P] Create ComponentVersionSchema and VersionManifestSchema in shared/schemas/version.ts
- [x] T019 [P] Create LearningSchema and PatternSchema in shared/schemas/state.ts
- [x] T020 [P] Create StateIndexSchema in shared/schemas/state.ts
- [x] T021 Create schema index exporting all schemas in shared/schemas/index.ts

### Storage Layer (with file locking)

- [x] T022 Install proper-lockfile dependency in shared/package.json
- [x] T023 Create file locking utilities with retry/backoff in shared/storage/lock.ts
- [x] T024 Create JSON read/write with locking in shared/storage/json.ts
- [x] T025 Create YAML read/write with locking in shared/storage/yaml.ts
- [x] T026 Create directory management utilities in shared/storage/directories.ts
- [x] T027 Create storage index in shared/storage/index.ts

### Version Utilities

- [x] T028 Create version comparison utilities (semver) in shared/version/semver.ts
- [x] T029 Create version manifest read/write in shared/version/manifest.ts
- [x] T030 Create compatibility checker in shared/version/compatibility.ts
- [x] T031 Create version index in shared/version/index.ts

### Unit Tests (constitution requirement)

- [x] T032 [P] Create test setup with Bun test runner in tests/setup.ts
- [x] T033 [P] Create schema unit tests for VersionedDataSchema in tests/unit/schemas/base.test.ts
- [x] T034 [P] Create schema unit tests for CoreSkillSchema in tests/unit/schemas/skill.test.ts
- [x] T035 [P] Create schema unit tests for ConfigSchema in tests/unit/schemas/config.test.ts
- [x] T036 [P] Create storage layer unit tests in tests/unit/storage/lock.test.ts
- [x] T037 [P] Create version utilities unit tests in tests/unit/version/compatibility.test.ts

### Core Skill Definitions (from existing plugins)

- [x] T038 Create core/skills/ directory structure
- [x] T039 [P] Create learning skill definition in core/skills/learning/skill.json
- [x] T040 [P] Create learning SKILL.md in core/skills/learning/SKILL.md
- [x] T041 [P] Create docs skill definition in core/skills/docs/skill.json
- [x] T042 [P] Create docs SKILL.md in core/skills/docs/SKILL.md
- [x] T043 [P] Create context skill definition in core/skills/context/skill.json
- [x] T044 [P] Create context SKILL.md in core/skills/context/SKILL.md
- [x] T045 [P] Create workflow skill definition in core/skills/workflow/skill.json
- [x] T046 [P] Create workflow SKILL.md in core/skills/workflow/SKILL.md

### Core Skill Unit Tests (constitution requirement)

- [x] T047 [P] Create learning skill unit tests in tests/unit/skills/learning.test.ts
- [x] T048 [P] Create docs skill unit tests in tests/unit/skills/docs.test.ts
- [x] T049 [P] Create context skill unit tests in tests/unit/skills/context.test.ts
- [x] T050 [P] Create workflow skill unit tests in tests/unit/skills/workflow.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Install Phil-AI System (Priority: P1)

**Goal**: Users can install phil-ai via `bunx phil-ai install` and have all components set up

**Independent Test**: Run `bunx phil-ai install` on clean machine, verify status reports healthy

### CLI Infrastructure

- [x] T051 [US1] Create CLI entry point with command router in cli/src/index.ts
- [x] T052 [US1] Create CLI argument parser in cli/src/lib/args.ts
- [x] T053 [US1] Create CLI output formatter (colors, tables) in cli/src/lib/output.ts
- [x] T054 [US1] Create CLI error handler with suggested fixes in cli/src/lib/errors.ts

### Install Command Implementation

- [x] T055 [US1] Create prerequisites checker (Bun version, disk space) in cli/src/commands/install/prerequisites.ts
- [x] T056 [US1] Create directory creator for ~/.local/share/phil-ai/ and ~/.config/phil-ai/ in cli/src/commands/install/directories.ts
- [x] T057 [US1] Create default config generator in cli/src/commands/install/config.ts
- [x] T058 [US1] Create version manifest initializer in cli/src/commands/install/version.ts
- [x] T059 [US1] Create install command orchestrator in cli/src/commands/install/index.ts
- [x] T060 [US1] Wire install command to CLI router in cli/src/index.ts
- [x] T061 [US1] Add --platforms, --force, --dry-run options per contracts/cli.md

### Platform Registration (Install Integration)

- [x] T062 [US1] Create Claude Code marketplace registration stub in cli/src/commands/install/platforms/claude-code.ts
- [x] T063 [US1] Create OpenCode config registration stub in cli/src/commands/install/platforms/opencode.ts
- [x] T064 [US1] Integrate platform registration into install flow in cli/src/commands/install/index.ts

### US1 Integration Test (constitution requirement)

- [x] T065 [US1] Create install command integration test in tests/integration/install.test.ts

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

### US2 Integration Test (constitution requirement)

- [x] T077 [US2] Create status command integration test in tests/integration/status.test.ts

**Checkpoint**: `bunx phil-ai status` shows component health with actionable guidance

---

## Phase 5: User Story 3 - Use Phil-AI on Claude Code (Priority: P3)

**Goal**: Users can install 4 phil-ai plugins in Claude Code from generated marketplace

**Independent Test**: Install Claude Code plugins, verify `/learn` command available

### Claude Code Generator

- [x] T078 [US3] Create plugin.json template in platforms/claude-code/templates/plugin.json.template
- [x] T079 [US3] Create SKILL.md template in platforms/claude-code/templates/skill.md.template
- [x] T080 [US3] Create command.md template in platforms/claude-code/templates/command.md.template
- [x] T081 [US3] Create README.md template in platforms/claude-code/templates/readme.md.template
- [x] T082 [US3] Create template renderer utility in platforms/claude-code/generator/render.ts
- [x] T083 [US3] Create skill-to-plugin transformer in platforms/claude-code/generator/transform.ts
- [x] T084 [US3] Create plugin validator (checks Claude Code requirements) in platforms/claude-code/generator/validate.ts
- [x] T085 [US3] Create generator orchestrator in platforms/claude-code/generator/index.ts

### Marketplace Generation

- [x] T086 [US3] Create marketplace.json generator in platforms/claude-code/generator/marketplace.ts
- [x] T087 [US3] Create output directory structure creator in platforms/claude-code/generator/output.ts
- [x] T088 [US3] Generate phil-ai-learning plugin in platforms/claude-code/output/phil-ai-learning/
- [x] T089 [P] [US3] Generate phil-ai-docs plugin in platforms/claude-code/output/phil-ai-docs/
- [x] T090 [P] [US3] Generate phil-ai-context plugin in platforms/claude-code/output/phil-ai-context/
- [x] T091 [P] [US3] Generate phil-ai-workflow plugin in platforms/claude-code/output/phil-ai-workflow/

### Install Integration (Claude Code)

- [x] T092 [US3] Implement full Claude Code registration in cli/src/commands/install/platforms/claude-code.ts
- [x] T093 [US3] Add Claude Code health check in cli/src/commands/status/checks/claude-code.ts

### US3 Generator Snapshot Tests (constitution requirement)

- [x] T094 [US3] Create Claude Code generator snapshot tests in tests/snapshot/claude-code-generator.test.ts
- [x] T095 [US3] Create Claude Code integration test (plugin loads in Claude Code) in tests/integration/claude-code.test.ts

**Checkpoint**: Claude Code marketplace with 4 plugins generated and installable

---

## Phase 6: User Story 4 - Use Phil-AI on OpenCode (Priority: P4)

**Goal**: Users can use phil-ai as OpenCode plugin with same functionality as Claude Code

**Independent Test**: Load OpenCode plugin, verify capture-learning tool available

### OpenCode Generator

- [x] T096 [US4] Create plugin index.ts template in platforms/opencode/templates/index.ts.template
- [x] T097 [US4] Create tool.ts template in platforms/opencode/templates/tool.ts.template
- [x] T098 [US4] Create package.json template in platforms/opencode/templates/package.json.template
- [x] T099 [US4] Create template renderer utility in platforms/opencode/generator/render.ts
- [x] T100 [US4] Create skill-to-tool transformer in platforms/opencode/generator/transform.ts
- [x] T101 [US4] Create plugin validator in platforms/opencode/generator/validate.ts
- [x] T102 [US4] Create generator orchestrator in platforms/opencode/generator/index.ts

### Plugin Generation

- [x] T103 [US4] Create output directory structure in platforms/opencode/output/
- [x] T104 [US4] Generate phil-ai plugin entry point in platforms/opencode/output/src/index.ts
- [x] T105 [P] [US4] Generate learning tool in platforms/opencode/output/src/tools/learning.ts
- [x] T106 [P] [US4] Generate docs tool in platforms/opencode/output/src/tools/docs.ts
- [x] T107 [P] [US4] Generate context tool in platforms/opencode/output/src/tools/context.ts
- [x] T108 [P] [US4] Generate workflow tool in platforms/opencode/output/src/tools/workflow.ts
- [x] T109 [US4] Generate plugin package.json in platforms/opencode/output/package.json

### Install Integration (OpenCode)

- [x] T110 [US4] Implement full OpenCode registration in cli/src/commands/install/platforms/opencode.ts
- [x] T111 [US4] Add OpenCode health check in cli/src/commands/status/checks/opencode.ts

### US4 Generator Snapshot Tests (constitution requirement)

- [x] T112 [US4] Create OpenCode generator snapshot tests in tests/snapshot/opencode-generator.test.ts
- [x] T113 [US4] Create OpenCode integration test (plugin loads in OpenCode) in tests/integration/opencode.test.ts

**Checkpoint**: OpenCode plugin generated with all 4 tool categories, feature parity with Claude Code

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: MCP server, additional CLI commands, documentation

### MCP Server

- [x] T114 Install @modelcontextprotocol/sdk dependency in mcp/package.json
- [x] T115 Create MCP server entry point in mcp/src/server.ts
- [x] T116 [P] Create capture-learning tool in mcp/src/tools/learning.ts
- [x] T117 [P] Create docs tools in mcp/src/tools/docs.ts
- [x] T118 [P] Create context tools in mcp/src/tools/context.ts
- [x] T119 [P] Create workflow tools in mcp/src/tools/workflow.ts
- [x] T120 Create MCP server bin entry in mcp/package.json

### MCP Contract Tests (constitution requirement)

- [x] T121 [P] Create MCP server contract tests in tests/contract/mcp-server.test.ts
- [x] T122 [P] Create MCP tool contract tests in tests/contract/mcp-tools.test.ts

### Additional CLI Commands

- [x] T123 Create update command with backup in cli/src/commands/update/index.ts
- [x] T124 Create data backup utility for updates (FR-010) in cli/src/commands/update/backup.ts
- [x] T125 Create data migration runner for updates (FR-010) in cli/src/commands/update/migrate.ts
- [x] T126 Create sync command in cli/src/commands/sync/index.ts
- [x] T127 Create generate command in cli/src/commands/generate/index.ts
- [x] T128 Wire update, sync, generate to CLI router in cli/src/index.ts

### Documentation

- [x] T129 Update root README.md with installation instructions
- [x] T130 [P] Create CLI usage documentation in docs/cli.md
- [x] T131 [P] Create plugin development guide in docs/plugins.md
- [x] T132 Create permission requirements documentation (FR-008) in docs/permissions.md

### Final Validation

- [x] T133 Run quickstart.md validation - verify all steps work
- [x] T134 Verify SC-001: Installation under 5 minutes
- [x] T135 Verify SC-002: Status check under 10 seconds
- [x] T136 Verify SC-003: Feature parity between platforms

### Cross-Platform Integration Test (constitution requirement)

- [x] T137 Create cross-platform state sharing test in tests/integration/cross-platform.test.ts

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
T032-T037 (unit tests) can all run in parallel
T039-T046 (core skills) can all run in parallel
T047-T050 (skill unit tests) can all run in parallel
```

**Within Phase 3 (US1)**:
```
T062, T063 (platform stubs) can run in parallel
```

**Within Phase 5 (US3)**:
```
T089-T091 (plugin generation) can run in parallel after T087
```

**Within Phase 6 (US4)**:
```
T105-T108 (tool generation) can run in parallel after T104
```

**Within Phase 7 (Polish)**:
```
T116-T119 (MCP tools) can run in parallel
T121-T122 (MCP contract tests) can run in parallel
T129-T132 (docs) can run in parallel
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T013)
2. Complete Phase 2: Foundational (T014-T050)
3. Complete Phase 3: US1 Install (T051-T065)
4. **STOP and VALIDATE**: `bunx phil-ai install` works
5. Can demo installation flow

### Incremental Delivery

| Milestone | Stories | Value Delivered |
|-----------|---------|-----------------|
| MVP | US1 | Users can install system |
| v0.2 | US1 + US2 | Users can verify health |
| v0.3 | US1 + US2 + US3 | Claude Code users have plugins |
| v1.0 | All stories | Full cross-platform support |

### Suggested Execution

**Solo Developer**:
1. Setup → Foundational → US1 → US2 → US3 → US4 → Polish

**Two Developers**:
1. Dev A: Setup + Foundational (together)
2. After Foundational:
   - Dev A: US1 → US3
   - Dev B: US2 → US4
3. Polish together

---

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label = maps task to specific user story (US1-US4)
- Each user story is independently testable after completion
- Commit after each task or logical group
- Foundational phase is critical - blocks all user stories
- MCP server (Phase 7) is cross-cutting but not required for MVP
