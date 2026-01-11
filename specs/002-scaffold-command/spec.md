# Feature Specification: Scaffold Command

**Feature Branch**: `002-scaffold-command`  
**Created**: 2026-01-03  
**Status**: Draft  
**Input**: User description: "Create scaffold command"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add OpenCode Support to Plugin (Priority: P1)

A plugin author has an existing Claude Code plugin and wants to make it work on OpenCode without maintaining two separate codebases. They run the scaffold command from within their plugin directory, and the command generates the necessary files to publish the plugin as an npm package that OpenCode can consume.

**Why this priority**: This is the core value proposition. Without this, the scaffold command has no purpose. A plugin author who completes this flow can immediately publish their plugin for both platforms.

**Independent Test**: Can be fully tested by running `bunx phil-ai scaffold` in a valid Claude Code plugin directory and verifying that the generated files enable the plugin to be built and installed on OpenCode.

**Acceptance Scenarios**:

1. **Given** a directory with `.claude-plugin/plugin.json`, `commands/*.md`, and optionally `skills/*/SKILL.md`, **When** user runs `bunx phil-ai scaffold`, **Then** the command generates `src/index.ts`, `package.json`, and `tsconfig.json` with correct metadata extracted from plugin.json.

2. **Given** a valid Claude Code plugin, **When** user runs scaffold, **Then** the generated `package.json` includes the plugin name, version, description, author, and repository from the existing plugin manifest.

3. **Given** a valid Claude Code plugin, **When** scaffold completes, **Then** user can run `bun build` to compile the OpenCode plugin and `bun add <plugin-name>` to install it.

---

### User Story 2 - Scaffold Remote Directory (Priority: P2)

A plugin author wants to add OpenCode support to a plugin located in a different directory than their current working directory. They use the `--path` flag to specify the target plugin location.

**Why this priority**: Convenience feature that allows batch operations or scaffolding from a central location. Useful but not essential for the core workflow.

**Independent Test**: Can be tested by running `bunx phil-ai scaffold --path=/path/to/plugin` from any directory and verifying the same output as P1.

**Acceptance Scenarios**:

1. **Given** a path to a valid Claude Code plugin, **When** user runs `bunx phil-ai scaffold --path=/path/to/plugin`, **Then** files are generated in the specified directory, not the current directory.

2. **Given** a non-existent path, **When** user runs scaffold with `--path`, **Then** the command displays a clear error message indicating the path does not exist.

---

### User Story 3 - Preview Changes Before Writing (Priority: P3)

A plugin author wants to see what files will be created before committing to the changes. They use a dry-run mode to preview the scaffolding without writing any files.

**Why this priority**: Safety feature for cautious users. Nice to have but not blocking for initial release.

**Independent Test**: Can be tested by running `bunx phil-ai scaffold --dry-run` and verifying no files are written while output shows what would be created.

**Acceptance Scenarios**:

1. **Given** a valid Claude Code plugin, **When** user runs `bunx phil-ai scaffold --dry-run`, **Then** the command displays what files would be created without actually writing them.

2. **Given** a plugin that already has OpenCode scaffolding, **When** user runs `bunx phil-ai scaffold --dry-run`, **Then** the command shows which files would be overwritten.

---

### Edge Cases

- What happens when `.claude-plugin/plugin.json` is missing or malformed?
  - Command displays error: "Not a valid Claude Code plugin: missing .claude-plugin/plugin.json"
- What happens when `commands/` directory doesn't exist?
  - Command proceeds but warns: "No commands directory found. Generated plugin will have no commands."
- What happens when `skills/` directory doesn't exist?
  - Command proceeds without warning (skills are optional). Generated plugin will have no skills.
- What happens when scaffolding files already exist (e.g., `package.json`)?
  - Command prompts for confirmation before overwriting, or user can pass `--force` to skip prompts.
- What happens when plugin.json lacks required fields (name, version)?
  - Command displays specific error about missing fields and exits.
- What happens when `.opencode/plugin/` already exists with other plugins?
  - Command creates/overwrites only the plugin file matching the current plugin name. Other files in the directory are preserved.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Command MUST read `.claude-plugin/plugin.json` to extract plugin metadata (name, version, description, author, repository).
- **FR-002**: Command MUST generate `.opencode/plugin/<plugin-name>.ts` for local development/testing, exporting a Plugin function with event hooks and tools.
- **FR-003**: Command MUST generate `src/index.ts` for npm publishing, containing the same Plugin export as the local version.
- **FR-004**: Command MUST generate `package.json` with correct npm package structure including exports, dependencies, and build scripts.
- **FR-005**: Command MUST generate `tsconfig.json` with appropriate configuration for building the plugin.
- **FR-006**: Command MUST update `.gitignore` to include `dist/` and `node_modules/` if not already present.
- **FR-007**: Command MUST validate that the target directory contains a valid Claude Code plugin before generating files.
- **FR-008**: Command MUST support `--path` flag to specify target directory (defaults to current directory).
- **FR-009**: Command MUST support `--dry-run` flag to preview changes without writing files.
- **FR-010**: Command MUST support `--force` flag to overwrite existing files without prompting.
- **FR-011**: Command MUST display clear progress and completion messages indicating what files were created.
- **FR-012**: Command MUST preserve existing `commands/*.md` files (read-only operation on source content).

### Key Entities

- **Plugin Manifest**: The `.claude-plugin/plugin.json` file containing metadata (name, version, description, author, repository, license).
- **Command File**: A markdown file in `commands/` with YAML frontmatter defining a slash command.
- **Skill File**: A markdown file at `skills/{skill-name}/SKILL.md` with YAML frontmatter defining a model-invoked capability.
- **Local Plugin**: The `.opencode/plugin/<name>.ts` file for local development and testing.
- **npm Package**: The set of files (`src/index.ts`, `package.json`, `tsconfig.json`) for npm publishing and distribution.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Plugin authors can add OpenCode support to an existing Claude Code plugin in under 1 minute using a single command.
- **SC-002**: Generated plugins build successfully without manual intervention (zero configuration required after scaffold).
- **SC-003**: 100% of commands defined in `commands/*.md` and skills defined in `skills/*/SKILL.md` are available in the OpenCode plugin after scaffolding.
- **SC-004**: Scaffold command completes in under 5 seconds for typical plugins (10 or fewer command files).
- **SC-005**: Users receive actionable error messages for all failure scenarios (no cryptic errors or stack traces).

## Clarifications

### Session 2026-01-03

- Q: Should the scaffold command convert skills to OpenCode format, or is this commands-only? → A: Include skills - OpenCode recently added native skill loading similar to commands.

### Session 2026-01-11

- Q: What output structure should the scaffold command generate for OpenCode? → A: Option C - Generate both local plugin (`.opencode/plugin/<name>.ts`) AND npm package structure (`src/index.ts`, `package.json`). OpenCode supports EITHER local files in `.opencode/plugin/` OR npm packages configured in `opencode.json` `"plugin"` array. Generating both allows users to test locally first, then publish to npm for distribution.

- Q: How should commands be transformed from Claude Code format to OpenCode? → A: NO transformation needed. Per Constitution Principle I, command format is IDENTICAL between platforms (markdown + YAML frontmatter). The generated plugin loads `commands/*.md` files at runtime and registers them via OpenCode's `config` hook. The constitution provides complete template code for this pattern (lines 206-301).

- Q: How should skills be transformed to OpenCode tools? → A: Generate tool STUBS with metadata extracted from SKILL.md (description, arguments), but the `execute` function must be placeholder code requiring manual implementation. Skills contain instructions for the model, not executable code. The scaffold generates: `tool({ description, args: { ... }, async execute(args) { /* TODO: Implement */ } })`. Users must implement the execute logic or the tool returns a "not implemented" message.

- Q: How do local plugin and npm package differ in structure? → A: The plugin code is IDENTICAL. Generate `src/index.ts` as the canonical source, then COPY (not symlink) to `.opencode/plugin/<name>.ts` for local testing. Both export the same Plugin function. Local file is for immediate testing; npm package is for distribution. The local copy enables `bunx opencode` to load the plugin without requiring npm publish first.

- Q: How should the scaffold command handle local testing to avoid conflicts with npm-published plugins? → A: Generate a dev marketplace for Claude Code local testing (Option B). For Claude Code, create `.claude-plugin/marketplace.json` with `name: "<plugin-name>-dev"` following the established pattern from `superpowers-developing-for-claude-code`. Installation then uses `my-plugin@my-plugin-dev` pattern. For OpenCode, the local `.opencode/plugin/<name>.ts` file provides immediate testing without marketplace indirection.

- Q: Should the scaffold command support reverse scaffolding (OpenCode → Claude Code)? → A: Out of scope for v1 (Option C). The current spec focuses on enabling existing Claude Code plugin authors to reach OpenCode users. Reverse scaffolding requires different template generation (markdown commands from code, skill structure from tools) and would double the scope. Document as future enhancement; ship v1 with Claude Code → OpenCode direction only.

## Assumptions

- Plugin authors have Bun installed (required for build and publishing).
- OpenCode plugin API uses the `Plugin` type pattern: `export const MyPlugin: Plugin = async ({ project, client, $ }) => { ... }`.
- OpenCode loads local plugins from `.opencode/plugin/` directory or npm packages via `opencode.json` `"plugin"` array.
- Claude Code plugin manifest follows the standard schema with `name`, `version`, `description` fields.
- Commands use the standard markdown + YAML frontmatter format supported by both platforms.
- Skills use the standard `skills/*/SKILL.md` format and OpenCode supports native skill loading.
