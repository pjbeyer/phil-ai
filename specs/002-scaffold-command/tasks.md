# Tasks: Scaffold Command

**Input**: Design documents from `/specs/002-scaffold-command/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/cli-interface.md, research.md

**Tests**: No explicit test tasks included (not requested). Tests can be added per quickstart.md if needed.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Exact file paths included in all descriptions

## Path Conventions

- **CLI source**: `cli/src/commands/scaffold/`
- **Tests**: `tests/unit/scaffold/`, `tests/integration/scaffold/`
- **Shared libs**: `cli/src/lib/`

---

## Phase 1: Setup

**Purpose**: Create command structure and integrate with CLI router

- [x] T001 Create scaffold command directory at cli/src/commands/scaffold/
- [x] T002 Add scaffold route to CLI router in cli/src/index.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core modules that ALL user stories depend on

**CRITICAL**: User story implementation cannot begin until this phase is complete

- [x] T003 [P] Create Zod schemas for PluginManifest, CommandFrontmatter, SkillFrontmatter in cli/src/commands/scaffold/schemas.ts
- [x] T004 [P] Create template constants (src/index.ts, package.json, tsconfig.json templates) in cli/src/commands/scaffold/templates.ts
- [x] T005 [P] Create render function for template variable substitution in cli/src/commands/scaffold/render.ts
- [x] T006 [P] Create toPascalCase utility for export name generation in cli/src/commands/scaffold/utils.ts

**Checkpoint**: Foundation ready - all core utilities available for user story implementation

---

## Phase 3: User Story 1 - Add OpenCode Support to Plugin (Priority: P1)

**Goal**: Plugin author runs `bunx phil-ai scaffold` in valid Claude Code plugin directory, generates all OpenCode scaffolding files

**Independent Test**: Run `bunx phil-ai scaffold` in superpowers-developing-for-claude-code, verify all 6 files generated correctly

### Implementation for User Story 1

- [x] T007 [US1] Implement validatePluginDirectory function (check .claude-plugin/plugin.json exists) in cli/src/commands/scaffold/validate.ts
- [x] T008 [US1] Implement parsePluginManifest function (read and validate with Zod schema) in cli/src/commands/scaffold/extract.ts
- [x] T009 [US1] Implement scanCommands function (glob commands/*.md, parse frontmatter) in cli/src/commands/scaffold/extract.ts
- [x] T010 [US1] Implement scanSkills function (glob skills/*/SKILL.md, extract metadata) in cli/src/commands/scaffold/extract.ts
- [x] T011 [US1] Implement generatePluginCode function (render src/index.ts with commands and skill stubs) in cli/src/commands/scaffold/generate.ts
- [x] T012 [US1] Implement generatePackageJson function (render package.json from manifest) in cli/src/commands/scaffold/generate.ts
- [x] T013 [US1] Implement generateTsConfig function (render tsconfig.json) in cli/src/commands/scaffold/generate.ts
- [x] T014 [US1] Implement generateMarketplace function (render .claude-plugin/marketplace.json with -dev suffix) in cli/src/commands/scaffold/generate.ts
- [x] T015 [US1] Implement updateGitignore function (append dist/, node_modules/ if missing) in cli/src/commands/scaffold/generate.ts
- [x] T016 [US1] Implement writeFiles function (write all generated files, create directories) in cli/src/commands/scaffold/output.ts
- [x] T017 [US1] Implement runScaffold entry point (orchestrate validate, extract, generate, output) in cli/src/commands/scaffold/index.ts
- [x] T018 [US1] Add success/error output messages per CLI contract in cli/src/commands/scaffold/index.ts

**Checkpoint**: User Story 1 complete - `bunx phil-ai scaffold` works in valid plugin directory

---

## Phase 4: User Story 2 - Scaffold Remote Directory (Priority: P2)

**Goal**: Plugin author runs `bunx phil-ai scaffold --path=/other/dir` to scaffold a plugin in a different directory

**Independent Test**: Run `bunx phil-ai scaffold --path=../superpowers-developing-for-claude-code` from any directory, verify files generated in target

### Implementation for User Story 2

- [x] T019 [US2] Add --path flag parsing to parseScaffoldOptions in cli/src/commands/scaffold/index.ts
- [x] T020 [US2] Implement path validation (check directory exists) in cli/src/commands/scaffold/validate.ts
- [x] T021 [US2] Update runScaffold to use options.path instead of cwd in cli/src/commands/scaffold/index.ts
- [x] T022 [US2] Add path-related error messages (path not found) in cli/src/commands/scaffold/index.ts

**Checkpoint**: User Story 2 complete - --path flag works correctly

---

## Phase 5: User Story 3 - Preview Changes Before Writing (Priority: P3)

**Goal**: Plugin author runs `bunx phil-ai scaffold --dry-run` to see what would be generated without writing files

**Independent Test**: Run `bunx phil-ai scaffold --dry-run` in valid plugin, verify no files written, output shows preview

### Implementation for User Story 3

- [x] T023 [US3] Add --dry-run flag parsing to parseScaffoldOptions in cli/src/commands/scaffold/index.ts
- [x] T024 [US3] Implement previewFiles function (show what would be created/overwritten) in cli/src/commands/scaffold/output.ts
- [x] T025 [US3] Add conditional logic in runScaffold to skip writeFiles when dryRun is true in cli/src/commands/scaffold/index.ts
- [x] T026 [US3] Add dry-run specific output formatting per CLI contract in cli/src/commands/scaffold/index.ts

**Checkpoint**: User Story 3 complete - --dry-run flag shows preview without writing

---

## Phase 6: Edge Cases & --force Flag

**Purpose**: Handle overwrite prompts and edge cases from spec

- [x] T027 Add --force flag parsing to parseScaffoldOptions in cli/src/commands/scaffold/index.ts
- [x] T028 Implement checkExistingFiles function (detect files that would be overwritten) in cli/src/commands/scaffold/output.ts
- [x] T029 Implement promptOverwrite function (confirm before overwriting, skip if --force) in cli/src/commands/scaffold/output.ts
- [x] T030 Add warnings for missing commands/ directory in cli/src/commands/scaffold/index.ts
- [x] T031 Add detailed validation error messages (missing fields with paths) in cli/src/commands/scaffold/validate.ts

**Checkpoint**: All edge cases handled - command behaves correctly in all scenarios

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, integration, final cleanup

- [x] T032 [P] Update CLI help text with scaffold command in cli/src/index.ts
- [x] T033 [P] Add scaffold command to CLI AGENTS.md in cli/AGENTS.md
- [x] T034 [P] Update root AGENTS.md with feature 002 as complete in AGENTS.md
- [x] T035 [P] Update README.md with scaffold usage examples in README.md
- [x] T036 Run quickstart.md validation (manual test with real plugin)
- [x] T037 Run lint and fix any issues with `bun run lint`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 - Core functionality
- **User Story 2 (Phase 4)**: Depends on Phase 3 (reuses validation/generation)
- **User Story 3 (Phase 5)**: Depends on Phase 3 (reuses validation/generation)
- **Edge Cases (Phase 6)**: Depends on Phase 3
- **Polish (Phase 7)**: Depends on all functional phases

### User Story Dependencies

- **User Story 1 (P1)**: Foundational only - MVP, core functionality
- **User Story 2 (P2)**: User Story 1 + --path flag extension
- **User Story 3 (P3)**: User Story 1 + --dry-run flag extension

### Within Each Phase

- Tasks marked [P] can run in parallel (different files)
- Sequential tasks within a user story build on each other
- Complete current phase before starting next

### Parallel Opportunities

**Foundational Phase (all [P], run together):**
```
T003: Create Zod schemas
T004: Create templates
T005: Create render function
T006: Create utils
```

**Polish Phase (all [P], run together):**
```
T032: Update CLI help
T033: Update CLI AGENTS.md
T034: Update root AGENTS.md
T035: Update README.md
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T006)
3. Complete Phase 3: User Story 1 (T007-T018)
4. **STOP and VALIDATE**: Test with real plugin
5. Ship MVP if ready

### Full Feature Delivery

1. Complete MVP (Phases 1-3)
2. Add Phase 4: User Story 2 (--path flag)
3. Add Phase 5: User Story 3 (--dry-run flag)
4. Add Phase 6: Edge Cases & --force
5. Complete Phase 7: Polish

### Estimated Task Counts

| Phase | Tasks | Parallel |
|-------|-------|----------|
| Setup | 2 | 0 |
| Foundational | 4 | 4 |
| User Story 1 | 12 | 0 |
| User Story 2 | 4 | 0 |
| User Story 3 | 4 | 0 |
| Edge Cases | 5 | 0 |
| Polish | 6 | 4 |
| **Total** | **37** | **8** |

---

## Notes

- All file paths are relative to repository root
- Templates come from constitution.md (embedded, not runtime loaded)
- Follow existing CLI patterns from validate/generate commands
- Use existing lib/args.ts and lib/output.ts utilities
- Commit after each completed user story phase
- Test each user story independently before proceeding

## Post-Implementation Review (2026-01-13)

### Completion Summary
- **Initial Implementation**: PR #237 (37 tasks completed, merged)
- **Bug Fixes**: PR #239 (3 issues discovered during real-world testing)

### Issues Discovered Post-Merge

**Issue #240 - marketplace.json Missing Required Fields**
- **Task**: T014 (generateMarketplace function)
- **Problem**: Template only included `name` and `source: "./"`, missing 7 required fields
- **Root Cause**: Task description said "render .claude-plugin/marketplace.json with -dev suffix" but didn't enumerate required fields
- **Fix**: Added description, owner, version, source object, author, license to template
- **Lesson**: Task descriptions for file generation should list ALL required fields, not assume "follow pattern"

**Issue #241 - Build Command Fails**
- **Task**: T013 (generatePackageJson function)
- **Problem**: Build script missing `--format esm` flag
- **Root Cause**: Task said "generate package.json with build scripts" but didn't specify exact flags
- **Fix**: Added `--format esm` to build command
- **Lesson**: Generated scripts should be tested end-to-end, not just syntax-validated

**Issue #242 - Next Steps Show Wrong Command**
- **Task**: T029 (display completion message)
- **Problem**: Message showed `bun build` instead of `bun run build`
- **Root Cause**: Copy-paste error, not validated against generated package.json
- **Fix**: Updated message to match package.json script
- **Lesson**: Success messages referencing generated files should be validated against actual content

### Testing Gap

**Missing from original tasks**: End-to-end test with a real plugin (e.g., phil-ai-learning). All three bugs would have been caught if T037 (quickstart validation) had included:
1. Run scaffold on phil-ai-learning
2. Run `bunx phil-ai validate` on generated marketplace.json
3. Run `bun install && bun run build` in scaffolded plugin
4. Verify all commands in success message work

### Recommendations for Future Task Lists

1. **Explicit Field Enumeration**: When generating files with schemas, list required fields in task description
2. **Script Execution Testing**: Include "verify script runs successfully" as acceptance criteria for generated scripts
3. **Cross-Command Integration**: When tasks generate files consumed by other commands, add integration test task
4. **Real-World Validation**: Include at least one end-to-end test with actual project data before marking feature complete
