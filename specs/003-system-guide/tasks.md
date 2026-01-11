# Tasks: System Guide

**Input**: Design documents from `/specs/003-system-guide/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/guide-schema.ts, research.md

**Tests**: Tests are NOT included by default. Add test tasks if TDD is explicitly requested.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

**Note**: User Story 3 (Agent Suggests Guide Updates) is OUT OF SCOPE for MVP per spec.md.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Monorepo structure**: `shared/src/`, `platforms/*/generator/`, `cli/src/`, `mcp/src/`
- **Tests**: `tests/unit/`, `tests/integration/`
- **Skills**: `core/skills/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add gray-matter dependency and basic structure

- [x] T001 Add gray-matter dependency: `bun add gray-matter && bun add -d @types/gray-matter`
- [x] T002 [P] Create directory structure: `shared/src/guide/`
- [x] T003 [P] Create directory structure: `core/skills/guide/`
- [x] T004 [P] Create directory structure: `tests/unit/guide/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core schemas and types that ALL user stories depend on

**CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create GuideSchema with PreferenceSchema in `shared/src/schemas/guide.ts` per contracts/guide-schema.ts
- [ ] T006 Export guide schemas from `shared/src/schemas/index.ts`
- [ ] T007 Create guide types in `shared/src/guide/types.ts` (GuidePath, ParseGuideResult, DiscoverGuidesResult)
- [ ] T008 Create guide module index in `shared/src/guide/index.ts`
- [ ] T009 Export guide module from `shared/src/index.ts`

**Checkpoint**: Foundation ready - schemas and types available for all user stories

---

## Phase 3: User Story 1 - Agent Consults Guide Before Acting (Priority: P1) MVP

**Goal**: Enable agents to automatically load and consult user preferences from GUIDE.md files at session start

**Independent Test**: Create a GUIDE.md file, start an agent session, verify the agent loads and references guide preferences before acting

### Implementation for User Story 1

- [ ] T010 [US1] Implement parseGuide function using gray-matter in `shared/src/guide/parser.ts`
- [ ] T011 [US1] Implement extractSections function to parse Markdown body in `shared/src/guide/parser.ts`
- [ ] T012 [US1] Implement discoverGuides function in `shared/src/guide/loader.ts`
- [ ] T013 [US1] Implement loadGuide function (single file) in `shared/src/guide/loader.ts`
- [ ] T014 [US1] Implement mergeGuides function with override semantics in `shared/src/guide/loader.ts`
- [ ] T015 [US1] Implement loadMergedGuide function (full hierarchy) in `shared/src/guide/loader.ts`
- [ ] T016 [P] [US1] Create skill.json for guide skill in `core/skills/guide/skill.json`
- [ ] T017 [P] [US1] Create SKILL.md with agent instructions in `core/skills/guide/SKILL.md`
- [ ] T018 [US1] Add "guide" case to getCommandsForSkill in `platforms/claude-code/generator/transform.ts`
- [ ] T019 [US1] Add "guide" case to getToolsForSkill in `platforms/opencode/generator/transform.ts`
- [ ] T020 [US1] Create guide injection module in `platforms/claude-code/generator/guide.ts`
- [ ] T021 [US1] Create guide injection module in `platforms/opencode/generator/guide.ts`
- [ ] T022 [US1] Integrate guide loading into Claude Code generateAll in `platforms/claude-code/generator/index.ts`
- [ ] T023 [US1] Integrate guide loading into OpenCode generateAll in `platforms/opencode/generator/index.ts`

**Checkpoint**: User Story 1 complete - agents can load and consult GUIDE.md files

---

## Phase 4: User Story 2 - User Updates Preferences (Priority: P2)

**Goal**: Enable users to view and edit their preferences through CLI commands

**Independent Test**: Run `phil-ai guide show` to display merged guide, edit GUIDE.md file, verify changes are reflected

### Implementation for User Story 2

- [ ] T024 [US2] Create guide command router in `cli/src/commands/guide/index.ts`
- [ ] T025 [P] [US2] Implement `phil-ai guide init` in `cli/src/commands/guide/init.ts`
- [ ] T026 [P] [US2] Implement `phil-ai guide show` in `cli/src/commands/guide/show.ts`
- [ ] T027 [P] [US2] Implement `phil-ai guide validate` in `cli/src/commands/guide/validate.ts`
- [ ] T028 [US2] Register guide command in CLI entry point `cli/src/index.ts`

**Checkpoint**: User Story 2 complete - users can manage guides via CLI

---

## Phase 5: User Story 4 - Multi-Platform Consistency (Priority: P3)

**Goal**: Ensure guide works identically on Claude Code and OpenCode platforms

**Independent Test**: Create guide in Claude Code project, access from OpenCode, verify same preferences load

### Implementation for User Story 4

- [ ] T029 [US4] Implement get_guide MCP tool in `mcp/src/tools/guide.ts`
- [ ] T030 [P] [US4] Implement list_preferences MCP tool in `mcp/src/tools/guide.ts`
- [ ] T031 [P] [US4] Implement check_preference MCP tool in `mcp/src/tools/guide.ts`
- [ ] T032 [US4] Register guide tools in MCP server `mcp/src/server.ts`
- [ ] T033 [US4] Add platform filtering for platform-specific preferences in `shared/src/guide/loader.ts`

**Checkpoint**: User Story 4 complete - guide works consistently across platforms

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, and cleanup

- [ ] T034 Update AGENTS.md with guide skill documentation
- [ ] T035 [P] Run `bun run lint` and fix any issues
- [ ] T036 [P] Run `bun test` and verify all existing tests pass
- [ ] T037 Run `bun run generate` and verify guide plugins are generated
- [ ] T038 Create example GUIDE.md in project root for testing
- [ ] T039 Manual verification: test guide loading in both Claude Code and OpenCode

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T004)
- **User Story 1 (Phase 3)**: Depends on Foundational (T005-T009)
- **User Story 2 (Phase 4)**: Depends on User Story 1 (T010-T023)
- **User Story 4 (Phase 5)**: Depends on User Story 1 (T010-T023)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1: Setup
    │
    ▼
Phase 2: Foundational (schemas, types)
    │
    ▼
Phase 3: User Story 1 (parser, loader, generators) ← MVP COMPLETE HERE
    │
    ├─────────────────┐
    ▼                 ▼
Phase 4: US2      Phase 5: US4
(CLI commands)    (MCP tools)
    │                 │
    └────────┬────────┘
             ▼
      Phase 6: Polish
```

### Within Each User Story

- Schemas before parsers
- Parsers before loaders
- Core logic before platform integration
- Platform generators before CLI/MCP tools

### Parallel Opportunities

**Phase 1 (Setup)**:
```
T002 || T003 || T004  (all directory creation)
```

**Phase 3 (User Story 1)**:
```
T016 || T017  (skill.json and SKILL.md)
T020 || T021  (platform guide modules)
```

**Phase 4 (User Story 2)**:
```
T025 || T026 || T027  (CLI commands)
```

**Phase 5 (User Story 4)**:
```
T030 || T031  (MCP tools after T029)
```

**Phase 6 (Polish)**:
```
T035 || T036  (lint and test)
```

---

## Parallel Example: User Story 1 Models & Skills

```bash
# After foundational phase, launch in parallel:
Task: "Create skill.json for guide skill in core/skills/guide/skill.json"
Task: "Create SKILL.md with agent instructions in core/skills/guide/SKILL.md"

# After parser complete, launch platform modules in parallel:
Task: "Create guide injection module in platforms/claude-code/generator/guide.ts"
Task: "Create guide injection module in platforms/opencode/generator/guide.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (4 tasks)
2. Complete Phase 2: Foundational (5 tasks)
3. Complete Phase 3: User Story 1 (14 tasks)
4. **STOP and VALIDATE**: Test guide loading works
5. Deploy/demo if ready - core value delivered!

### Incremental Delivery

1. Setup + Foundational → Schemas ready
2. User Story 1 → Agents can consult guides (MVP!)
3. User Story 2 → Users can manage guides via CLI
4. User Story 4 → Cross-platform parity
5. Polish → Production ready

### Single Developer Strategy

Execute in strict order: Setup → Foundational → US1 → US2 → US4 → Polish

Total: **39 tasks**

---

## Notes

- User Story 3 (Agent Suggests Guide Updates) is OUT OF SCOPE per spec.md
- Tests are not included - add if TDD is requested
- [P] tasks can run in parallel within their phase
- [Story] label maps task to specific user story
- Each user story is independently testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
