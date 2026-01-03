<!--
=============================================================================
SYNC IMPACT REPORT
=============================================================================
Version Change: 1.2.0 → 1.2.1

Modified Sections:
- Permission Management → Corrected cache path structure and glob syntax details

Added Sections: None

Removed Sections: None

Templates Requiring Updates:
- .specify/templates/plan-template.md      ✅ Compatible (no changes needed)
- .specify/templates/spec-template.md      ✅ Compatible (no changes needed)
- .specify/templates/tasks-template.md     ✅ Compatible (no changes needed)

Follow-up TODOs: None
=============================================================================
-->

# Phil-AI Constitution

## Core Principles

### I. Hierarchy-First

Information MUST exist at exactly one level in the hierarchy. Duplication across
levels is forbidden.

**Hierarchy Levels** (from broadest to narrowest scope):
1. **Global** (`~/Projects`) - Cross-profile patterns, universal standards
2. **Profile** (`~/Projects/{profile}`) - Profile-specific tools, workflows, preferences
3. **Project** - Project-specific patterns, documentation, configuration
4. **Agent** - Agent-specific capabilities, improvements, learnings

**Rules:**
- Each piece of information MUST live at the most general level where it applies
- Child levels inherit from parent levels; they MUST NOT redefine inherited content
- When information applies to multiple profiles but not all: elevate to Global with
  conditional application, not duplicate across profiles

**Rationale:** Prevents synchronization drift, reduces maintenance burden, ensures
single source of truth.

### II. Token Efficiency

Context loading MUST be scope-aware. Load only what is relevant to the current
operation.

**Rules:**
- Agent documentation (AGENTS.md) MUST be optimized for machine consumption
- Human documentation follows readability standards; machine documentation follows
  density standards
- MCP configuration MUST enable/disable capabilities based on project needs
- Unused context is wasted context; every loaded token MUST serve the current task

**Rationale:** AI context windows are finite. Wasted tokens reduce effective
capability and increase cost.

### III. Closed-Loop Learning

All learnings MUST flow through documentation before implementation. Documentation
is the source of truth.

**Learning Flow:**
1. **Observe** - Identify pattern, improvement, or correction needed
2. **Document** - Update relevant documentation first (AGENTS.md, README, guides)
3. **Implement** - Apply the documented change to code/behavior
4. **Verify** - Confirm implementation matches documentation

**Rules:**
- A learning is NOT complete until documentation is updated
- Implementation without documentation update is technical debt
- Cross-profile patterns MUST be extracted and documented at Global level

**Rationale:** Documentation-first ensures knowledge persists beyond individual
sessions and enables pattern extraction across contexts.

### IV. Cross-Platform Compatibility

Core functionality MUST be platform-agnostic. Platform-specific implementations
derive from shared definitions. Each platform has distinct architectural patterns
that MUST be respected.

**Architecture:**
```
core/skills/           → Universal skill definitions (Agent Skills spec)
     ↓
mcp/                   → MCP server (cross-platform access)
     ↓
platforms/claude-code/ → Claude Code plugin generation (Markdown + JSON)
platforms/opencode/    → OpenCode plugin generation (TypeScript modules)
```

**Rules:**
- All capabilities MUST be defined in `core/` first using Agent Skills spec
- MCP server exposes core capabilities for any compatible client
- Platform generators produce platform-specific formats from core definitions
- Platform-specific code MUST NOT contain business logic; only integration glue
- Generator output MUST conform to each platform's native conventions

**Rationale:** Avoids vendor lock-in, enables tool reuse, reduces duplication.

### V. Version-Aware State

All persisted state MUST include version metadata. Version drift MUST be detected
and handled explicitly.

**Rules:**
- Data files MUST include a `_version` field indicating the schema version
- Code loading data MUST validate version compatibility before proceeding
- Version mismatches MUST produce explicit errors, not silent corruption
- Migrations MUST be explicit, documented, and reversible where possible

**Storage Schema:**
```json
{
  "_version": "1.0.0",
  "_created": "2026-01-02T12:00:00Z",
  "_modified": "2026-01-02T12:00:00Z",
  "data": { ... }
}
```

**Rationale:** Silent migrations cause data loss and debugging nightmares.
Explicit versioning enables safe evolution.

## Technical Standards

### Storage Locations

| Type | Location | Purpose |
|------|----------|---------|
| Private Data | `~/.local/share/phil-ai/` | Learnings, patterns, state (XDG compliant) |
| Global Config | `~/.config/phil-ai/` | User preferences, credentials (XDG compliant) |
| Project Config | `.phil-ai/` | Project-specific overrides |
| Plugin Cache | Platform-specific | Managed by platform (Claude Code, OpenCode) |

### Specification Compliance

- **Agent Skills**: All skills MUST conform to [agentskills.io](https://agentskills.io/specification.md)
- **MCP**: MCP server MUST follow [Model Context Protocol](https://modelcontextprotocol.io) specification
- **OpenCode Plugins**: MUST follow OpenCode plugin structure (JS/TS modules with hooks)
- **Claude Code Plugins**: MUST follow Claude Code structure (`.claude-plugin/` + Markdown components)

### CLI Interface

The `phil-ai` CLI MUST support:
- `bunx phil-ai install` - Install/update all components
- `bunx phil-ai update` - Update to latest versions
- `bunx phil-ai status` - Show installed versions and health
- `bunx phil-ai sync` - Synchronize state across platforms

## Platform Plugin Architectures

### Claude Code Plugins (Declarative, File-Based)

**Structure**: Components discovered by directory structure with Markdown + JSON files.

```
plugin/
├── .claude-plugin/
│   └── plugin.json          # Manifest (ONLY file in this directory)
├── commands/                 # Slash commands (Markdown + frontmatter)
│   └── deploy.md
├── agents/                   # Subagents (Markdown + frontmatter)
│   └── reviewer.md
├── skills/                   # Agent Skills (model-invoked)
│   └── code-review/
│       ├── SKILL.md         # Required: name, description in frontmatter
│       └── reference.md     # Optional: progressive disclosure
├── hooks/
│   └── hooks.json           # Event handlers (JSON config)
├── .mcp.json                # MCP server definitions
├── .lsp.json                # LSP server configurations
└── scripts/                 # Hook/utility scripts
```

**Key Characteristics:**
- Skills are **model-invoked** (Claude decides when to use based on description)
- Commands require explicit `/command` invocation
- Hooks use JSON configuration with event matchers
- Agents are declarative Markdown with capabilities frontmatter

**Hook Events:** `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `PermissionRequest`,
`UserPromptSubmit`, `Notification`, `Stop`, `SubagentStart`, `SubagentStop`,
`SessionStart`, `SessionEnd`, `PreCompact`

**Hook Types:** `command` (shell), `prompt` (LLM eval), `agent` (agentic verifier)

### OpenCode Plugins (Programmatic, Code-Based)

**Structure**: JavaScript/TypeScript modules exporting plugin functions.

```typescript
// .opencode/plugin/my-plugin.ts
import type { Plugin } from "@opencode-ai/plugin"

export const MyPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  return {
    // Event hooks (code-based)
    "tool.execute.before": async (input, output) => { ... },
    "session.idle": async () => { ... },
    
    // Custom tools (Zod schemas)
    tool: {
      mytool: tool({
        description: "Tool description",
        args: { param: tool.schema.string() },
        async execute(args, ctx) { return "result" }
      })
    }
  }
}
```

**Loading Methods:**
- Local files: `.opencode/plugin/` or `~/.config/opencode/plugin/`
- npm packages: `"plugin": ["package-name"]` in `opencode.json`

**Key Characteristics:**
- Plugins are code modules, not file structures
- Tools defined programmatically with Zod schemas
- Events subscribed via code, not JSON config
- Dependencies via `package.json` in config directory

**Events:** `command.executed`, `file.edited`, `file.watcher.updated`, `message.*`,
`session.*` (created/compacted/deleted/diff/error/idle/status/updated),
`tool.execute.before`, `tool.execute.after`, `tui.*`, `lsp.*`, `permission.*`

### Platform Mapping Table

Core concepts MUST map to platform-native equivalents:

| Core Concept | Claude Code | OpenCode |
|--------------|-------------|----------|
| **Skill** | `skills/*/SKILL.md` (model-invoked) | `tool` hook (explicit invocation) |
| **Command** | `commands/*.md` (Markdown) | Config `commands` or custom tool |
| **Agent** | `agents/*.md` (declarative) | Config `agents` (limited) |
| **Hook** | `hooks/hooks.json` (JSON) | Event subscriptions (code) |
| **MCP Server** | `.mcp.json` | Native MCP support |
| **Tool Extension** | MCP servers | `tool` hook with Zod |
| **Installation** | Marketplace + cache | Local files or npm |

### Platform-Specific Generation Rules

**Claude Code Generator MUST:**
- Output Markdown files with YAML frontmatter for commands/agents/skills
- Generate `plugin.json` manifest in `.claude-plugin/` directory
- Place all components at plugin root (NOT inside `.claude-plugin/`)
- Use `${CLAUDE_PLUGIN_ROOT}` for script paths in hooks
- Include `name` and `description` in all SKILL.md frontmatter

**OpenCode Generator MUST:**
- Output TypeScript modules exporting `Plugin` functions
- Use `@opencode-ai/plugin` types for type safety
- Define tools with `tool()` helper and Zod schemas
- Subscribe to events via return object properties
- Support both local file and npm package distribution

**MCP Server MUST:**
- Work identically on both platforms (MCP is platform-agnostic)
- Expose all core capabilities as MCP tools
- Follow batch operation patterns for efficiency
- Include proper error handling and timeouts

## Permission Management

### The Problem: Claude Code Bash Script Permissions

Claude Code requires explicit permission allowlisting for bash script execution.
Plugin scripts installed to the cache directory require verbose path specifications
in `settings.json`. The cache architecture uses a hierarchical structure that includes
marketplace, plugin name, and version, compounding the management burden.

**Cache Path Structure:**
```
~/.claude/plugins/cache/{MARKETPLACE}/{PLUGIN}/{VERSION}/scripts/
```

**Example of permission bloat:**
```json
// ~/.claude/settings.json
{
  "permissions": {
    "allow": [
      "Bash(~/.claude/plugins/cache/phil-ai/phil-ai-learning/1.2.0/scripts/capture.sh:*)",
      "Bash(~/.claude/plugins/cache/phil-ai/phil-ai-learning/1.2.0/scripts/search.sh:*)",
      "Bash(~/.claude/plugins/cache/phil-ai/phil-ai-learning/1.2.0/scripts/implement.sh:*)",
      "Bash(~/.claude/plugins/cache/phil-ai/phil-ai-docs/1.1.0/scripts/optimize.sh:*)",
      "Bash(~/.claude/plugins/cache/phil-ai/phil-ai-docs/1.1.0/scripts/publish.sh:*)",
      "Bash(~/.claude/plugins/cache/phil-ai/phil-ai-context/1.0.0/scripts/analyze.sh:*)",
      // ... dozens more, breaking on every plugin update
    ]
  }
}
```

**Permission Syntax:** `Bash(EXACT_PATH:ARGUMENT_GLOB)`
- Path portion MUST be exact (no wildcards in path)
- Glob syntax (`:*`) applies only to command arguments
- Each script requires a separate permission entry

**Issues:**
- Global `settings.json` becomes bloated and difficult to maintain
- Version identifiers in paths break permissions on every plugin update
- Manual permission management does not scale across multiple plugins
- No wildcard support for plugin paths (only arguments)

### OpenCode Permission Model

OpenCode plugins execute within the Bun runtime using the `$` shell API. Permission
management is implicit through the plugin loading mechanism rather than explicit
allowlisting. Code-based plugins have fewer permission friction points.

### Mitigation Strategies (Priority Order)

**1. MCP-First (STRONGLY PREFERRED)**

MCP tools do not require bash permission allowlisting. Expose functionality through
the MCP server instead of bash scripts wherever possible.

```json
// .mcp.json - No permission entries needed
{
  "mcpServers": {
    "phil-ai": {
      "command": "npx",
      "args": ["phil-ai-mcp-server"]
    }
  }
}
```

**Rules:**
- New capabilities MUST be implemented as MCP tools first
- Bash scripts SHOULD only be used when MCP is technically infeasible
- Existing bash-based functionality SHOULD be migrated to MCP over time

**2. Skill-Level `allowed-tools` (Claude Code Only)**

Skills can pre-authorize specific tools in frontmatter, reducing per-session prompts:

```yaml
---
name: code-formatter
description: Format code files using project standards
allowed-tools: Read, Write, Bash(npx prettier:*)
---
```

**Rules:**
- Use `allowed-tools` to scope permissions to specific, known-safe operations
- Prefer specific tool patterns over broad wildcards
- Document which tools are authorized and why

**3. Project-Scoped Permissions**

Use `.claude/settings.json` (project-level) instead of `~/.claude/settings.json`
(global) to contain permission sprawl:

```json
// .claude/settings.json (committed with project)
{
  "permissions": {
    "allow": [
      "Bash(./scripts/build.sh:*)",
      "Bash(./scripts/test.sh:*)"
    ]
  }
}
```

**Rules:**
- Project-specific scripts SHOULD use project-scoped permissions
- Global permissions SHOULD be reserved for truly cross-project tools
- Permission files SHOULD be version-controlled with the project

**4. Hook Type Alternatives**

When bash scripts are used in hooks, consider alternatives:

| Instead of... | Consider... |
|---------------|-------------|
| `"type": "command"` with bash | `"type": "prompt"` for LLM evaluation |
| `"type": "command"` with bash | `"type": "agent"` for agentic verification |
| Complex bash logic | MCP tool invocation |

**5. When Bash Scripts ARE Necessary**

If bash scripts cannot be avoided:

- Keep scripts minimal and focused (single responsibility)
- Use `${CLAUDE_PLUGIN_ROOT}` variable in hook definitions
- Document required permissions in plugin README
- Consider providing a permission snippet users can copy
- Implement idempotent scripts that fail gracefully

**Permission Documentation Template:**
```markdown
## Required Permissions

Add to your `~/.claude/settings.json`:

\`\`\`json
{
  "permissions": {
    "allow": [
      "Bash(~/.claude/plugins/cache/MARKETPLACE/PLUGIN/VERSION/scripts/SCRIPT.sh:*)"
    ]
  }
}
\`\`\`

Note: Each script requires a separate entry. Path wildcards are not supported.
Replace MARKETPLACE, PLUGIN, VERSION, and SCRIPT with actual values.
```

### Design Implications

**For Core Skill Design:**
- Default to MCP tool implementation
- Bash scripts are last resort, not first choice
- Consider permission UX in feature design

**For Generator Output:**
- Claude Code generator SHOULD minimize bash script usage
- When bash is required, generator SHOULD output permission documentation
- Generator SHOULD prefer `prompt` or `agent` hook types over `command`

**For CLI (`bunx phil-ai`):**
- CLI SHOULD detect and report permission issues
- CLI MAY offer to configure permissions (with user consent)
- CLI SHOULD warn when plugin update will break permissions

## Development Workflow

### Plugin Development

1. **Define in Core First**: New capabilities start in `core/skills/`
2. **Validate Against Spec**: Use skills-ref tool to validate Agent Skills compliance
3. **Generate Platform Plugins**: Run generators to produce platform-specific code
4. **Test on Each Platform**: Verify functionality on Claude Code and OpenCode

### Testing Requirements

- All core skills MUST have unit tests
- Integration tests MUST cover cross-platform scenarios
- MCP server MUST have contract tests for all exposed operations
- Platform generators MUST have snapshot tests
- Generated plugins MUST be tested on target platforms

### Contribution Guidelines

1. Check Constitution compliance before submitting changes
2. Update documentation alongside code changes (Principle III)
3. Ensure changes work across all supported platforms (Principle IV)
4. Include version metadata in any new data schemas (Principle V)
5. Verify generated output matches platform conventions
6. Prefer MCP tools over bash scripts for new functionality

## Governance

### Amendment Procedure

1. **Propose**: Document proposed change with rationale
2. **Review**: Assess impact on existing practices and templates
3. **Update**: Modify constitution with version bump
4. **Propagate**: Update all dependent templates and documentation
5. **Communicate**: Document changes in Sync Impact Report (top of this file)

### Versioning Policy

Constitution follows semantic versioning:
- **MAJOR**: Backward-incompatible principle changes, removals, or redefinitions
- **MINOR**: New principles added, material expansions to existing guidance
- **PATCH**: Clarifications, wording improvements, typo fixes

### Compliance Review

- All PRs MUST verify compliance with Constitution principles
- Deviations MUST be documented with explicit justification
- Quarterly review of Constitution relevance recommended

**Version**: 1.2.1 | **Ratified**: 2026-01-02 | **Last Amended**: 2026-01-02
