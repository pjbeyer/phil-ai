<!--
=============================================================================
SYNC IMPACT REPORT
=============================================================================
Version Change: 2.0.0 → 2.0.1

Modified Sections:
- Core Principles: Added Rationale subsections to all 4 principles
- Principle III (Token Efficiency): Expanded with concrete guidance
- Governance: Added Compliance Review subsection

Added Sections:
- Rationale for each principle
- Compliance Review expectations

Removed Sections:
- None

Templates Requiring Updates:
- .specify/templates/plan-template.md      ✅ Compatible (Constitution Check 
  section references constitution gates; current principles are testable)
- .specify/templates/spec-template.md      ✅ Compatible (no constitution refs)
- .specify/templates/tasks-template.md     ✅ Compatible (no constitution refs)

Follow-up TODOs: None
=============================================================================
-->

# Phil-AI Constitution

## Mission

Mirror capabilities between coding agent platforms with minimal effort.

**Supported Platforms:**
- Claude Code (Anthropic)
- OpenCode

**Capability Types:**
- Commands (slash commands)
- Skills (model-invoked capabilities)
- Tools (MCP tools)
- Hooks (event handlers)
- Agents (subagents)

## Core Principles

### I. Dual-Platform Native Support

Every plugin MUST work natively on both platforms. No wrappers, no compatibility layers.

**Rationale:** Wrappers add maintenance burden and latency. Native support ensures each platform
gets first-class treatment and users get the best possible experience regardless of platform choice.

**Key Insight:** Command format is IDENTICAL between platforms. Both use markdown with YAML frontmatter:
```markdown
---
description: Command description
agent: optional-agent
model: optional-model
---

Command template content here
```

**Platform Difference:** Only the discovery mechanism differs:
- **Claude Code**: File-based discovery at `commands/*.md`
- **OpenCode**: Plugin loads files and registers via config hook

**Rules:**
- Define commands once in markdown format
- Add platform-specific scaffolding for installation
- Both platforms MUST read the same source files

### II. Hierarchy-First

Information MUST exist at exactly one level. No duplication across levels.

**Rationale:** Duplication creates drift. When information exists in multiple places, updates get
missed, conflicts arise, and the system becomes untrustworthy. Single-source-of-truth is mandatory.

**Levels:**
1. **Global** - Cross-profile patterns (applies to all work)
2. **Profile** - Profile-specific workflows (e.g., work vs personal)
3. **Project** - Project-specific configuration
4. **Agent** - Agent-specific capabilities

**Rules:**
- Before adding information, determine the correct level
- If information applies to multiple projects, it belongs at Profile or Global level
- If information is project-specific, it MUST NOT be duplicated to other projects

### III. Token Efficiency

Load only relevant context. Every loaded token MUST serve the current task.

**Rationale:** Context windows are finite and expensive. Loading irrelevant information degrades
model performance, increases latency, and wastes computational resources.

**Rules:**
- Skills MUST be invoked only when needed (not preloaded)
- Commands MUST load only the context required for their specific operation
- Documentation MUST be structured for selective loading (headers, sections)
- Plugins MUST NOT include verbose examples or explanations in runtime context

**Concrete Guidance:**
- Prefer 10 lines of precise instruction over 100 lines of verbose explanation
- Use references ("see X") rather than inline duplication
- Structure documents so sections can be loaded independently

### IV. Version-Aware State

All persisted state MUST include version metadata.

**Rationale:** Schema evolution is inevitable. Without version metadata, migrations become
impossible to perform safely, and data corruption risks increase with each change.

**Rules:**
- Every JSON/YAML file with persistent state MUST include `_version`
- Timestamps MUST use ISO 8601 format
- Version changes MUST follow semver (breaking changes = major bump)

**Required Metadata:**
```json
{
  "_version": "1.0.0",
  "_created": "2026-01-02T12:00:00Z",
  "_modified": "2026-01-02T12:00:00Z"
}
```

## Architecture

### Repository Structure

```
phil-ai (this monorepo)
├── cli/                     CLI commands (install, status, scaffold, generate)
├── mcp/                     MCP server (platform-agnostic capability access)
├── shared/                  Schemas, storage, version utilities
└── .claude-plugin/
    └── marketplace.json     Points to external plugin repos

External Plugin Repos (DUAL-PLATFORM)
├── phil-ai-learning/        Learning plugin (Claude Code + OpenCode)
├── phil-ai-docs/            Documentation plugin (Claude Code + OpenCode)
├── phil-ai-context/         Context management plugin (Claude Code + OpenCode)
└── phil-ai-workflow/        Workflow plugin (Claude Code + OpenCode)
```

### What Each Component Provides

| Component | Purpose |
|-----------|---------|
| `phil-ai` monorepo | CLI, MCP server, marketplace index, scaffolding generator |
| External plugin repos | Dual-platform plugins (Claude Code native + OpenCode npm package) |
| `.claude-plugin/marketplace.json` | Points Claude Code to external repos |
| `phil-ai-mcp` | Platform-agnostic tools via MCP protocol |

## Dual-Platform Plugin Structure

Each external plugin repo follows this structure:

```
phil-ai-{name}/
├── .claude-plugin/
│   └── plugin.json           # Claude Code manifest
├── commands/                  # Shared command definitions (both platforms use these)
│   ├── command1.md
│   └── command2.md
├── skills/                    # Claude Code skills (SKILL.md files)
│   └── skill-name/
│       └── SKILL.md
├── config/                    # Plugin configuration
├── scripts/                   # Bash scripts (if needed)
├── docs/                      # Documentation
│
│ # OpenCode scaffolding (added by phil-ai scaffold)
├── src/
│   └── index.ts              # OpenCode plugin entry point
├── package.json              # npm package configuration
├── tsconfig.json             # TypeScript configuration
└── README.md
```

### How It Works

**Claude Code Installation:**
```bash
/plugin marketplace add pjbeyer/phil-ai
/plugin install phil-ai-learning@phil-ai
```
Claude Code discovers `commands/*.md` and `skills/*/SKILL.md` natively.

**OpenCode Installation:**
```bash
bun add phil-ai-learning
# Then add to ~/.config/opencode/config.json: { "plugins": ["phil-ai-learning"] }
```
OpenCode loads the npm package, which reads `commands/*.md` and registers them via config hook.

## Scaffolding Templates

The `phil-ai scaffold` command adds OpenCode support to existing Claude Code plugin repos.

### src/index.ts Template

```typescript
/**
 * {{pluginName}} - OpenCode Plugin Entry
 * 
 * Loads commands from commands/*.md and registers them with OpenCode.
 * This enables the same commands to work on both Claude Code and OpenCode.
 */

import type { Plugin } from '@opencode-ai/plugin';
import path from 'path';

interface CommandFrontmatter {
  description?: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
}

interface ParsedCommand {
  name: string;
  frontmatter: CommandFrontmatter;
  template: string;
}

function parseFrontmatter(content: string): { frontmatter: CommandFrontmatter; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, body: content.trim() };
  }

  const [, yamlContent, body] = match;
  const frontmatter: CommandFrontmatter = {};

  for (const line of yamlContent.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    const value = line.slice(colonIndex + 1).trim();

    if (key === 'description') frontmatter.description = value;
    if (key === 'agent') frontmatter.agent = value;
    if (key === 'model') frontmatter.model = value;
    if (key === 'subtask') frontmatter.subtask = value === 'true';
  }

  return { frontmatter, body: body.trim() };
}

async function loadCommands(): Promise<ParsedCommand[]> {
  const commands: ParsedCommand[] = [];
  // Commands are in the parent directory relative to dist/
  const commandDir = path.join(import.meta.dir, '..', 'commands');
  const glob = new Bun.Glob('**/*.md');

  for await (const file of glob.scan({ cwd: commandDir, absolute: true })) {
    const content = await Bun.file(file).text();
    const { frontmatter, body } = parseFrontmatter(content);

    const relativePath = path.relative(commandDir, file);
    const name = relativePath.replace(/\.md$/, '').replace(/\//g, '-');

    commands.push({
      name,
      frontmatter,
      template: body,
    });
  }

  return commands;
}

export const {{PluginExportName}}: Plugin = async () => {
  const commands = await loadCommands();

  return {
    async config(config) {
      config.command = config.command ?? {};

      for (const cmd of commands) {
        config.command[cmd.name] = {
          template: cmd.template,
          description: cmd.frontmatter.description,
          agent: cmd.frontmatter.agent,
          model: cmd.frontmatter.model,
          subtask: cmd.frontmatter.subtask,
        };
      }
    },
  };
};
```

### package.json Template

```json
{
  "name": "{{packageName}}",
  "version": "{{version}}",
  "description": "{{description}}",
  "author": {
    "name": "{{authorName}}",
    "email": "{{authorEmail}}"
  },
  "license": "MIT",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "repository": {
    "type": "git",
    "url": "{{repositoryUrl}}"
  },
  "publishConfig": {
    "access": "public"
  },
  "files": [
    "dist",
    "commands"
  ],
  "scripts": {
    "build": "bun build ./src/index.ts --outdir dist --target bun",
    "prepublishOnly": "bun run build"
  },
  "dependencies": {
    "@opencode-ai/plugin": "^1.0.85"
  },
  "devDependencies": {
    "bun-types": "latest",
    "typescript": "^5.0.0"
  }
}
```

### tsconfig.json Template

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "types": ["bun-types"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## CLI Commands

| Command | Purpose |
|---------|---------|
| `bunx phil-ai install` | Install phil-ai system (MCP server, config) |
| `bunx phil-ai scaffold` | Add OpenCode scaffolding to a Claude Code plugin repo |
| `bunx phil-ai status` | Check system health |
| `bunx phil-ai generate` | Generate marketplace.json from external repos |
| `bunx phil-ai-mcp` | Run MCP server |

### scaffold Command

```bash
# Run from within a Claude Code plugin repo
bunx phil-ai scaffold

# Or specify a path
bunx phil-ai scaffold --path=/path/to/phil-ai-learning
```

**What it does:**
1. Reads `.claude-plugin/plugin.json` for metadata
2. Creates `src/index.ts` with command loader
3. Creates `package.json` for npm publishing
4. Creates `tsconfig.json` for TypeScript
5. Updates `.gitignore` for `dist/` and `node_modules/`

## Platform Specifications

### Claude Code (Declarative)

```
plugin/
├── .claude-plugin/plugin.json    # Manifest
├── commands/                      # Slash commands (Markdown)
├── skills/                        # Model-invoked skills (SKILL.md)
├── hooks/hooks.json              # Event handlers (optional)
└── .mcp.json                     # MCP server config (optional)
```

**Characteristics:**
- File-based discovery
- Markdown + JSON configuration
- Skills are model-invoked (Claude decides when to use)

### OpenCode (Programmatic)

```typescript
export const Plugin: Plugin = async (ctx) => ({
  tool: { ... },           // Optional tools
  async config(config) {   // Config hook for commands
    config.command = { ... }
  }
})
```

**Characteristics:**
- Code-based modules (npm packages)
- Config hook for command registration
- Same markdown format for commands

### Capability Mapping

| Concept | Claude Code | OpenCode |
|---------|-------------|----------|
| Command | `commands/*.md` (discovered) | `commands/*.md` (loaded via hook) |
| Skill | `skills/*/SKILL.md` | Tool with rich description |
| Hook | `hooks/hooks.json` | Event subscription in plugin |
| MCP | `.mcp.json` | Native MCP support |

## Storage

| Type | Location |
|------|----------|
| Private Data | `~/.local/share/phil-ai/` |
| Config | `~/.config/phil-ai/` |
| Project Config | `.phil-ai/` |

## MCP Strategy

MCP tools are platform-agnostic. Prefer MCP for capabilities that:
- Need to work identically on both platforms
- Require complex logic better expressed in code
- Would otherwise need bash scripts (permission issues on Claude Code)

## Governance

### Amendment Procedure

1. Propose change with rationale
2. Assess impact on both platforms
3. Update constitution with version bump
4. Update Sync Impact Report

### Versioning

- **MAJOR**: Breaking changes to principles or architecture
- **MINOR**: New guidance or expanded sections
- **PATCH**: Clarifications, rationale additions, fixes

### Compliance Review

Constitution compliance MUST be verified:
- **Before feature implementation**: Check plan against principles
- **During code review**: Verify no principle violations
- **After major changes**: Re-validate all plugins against current constitution

**Verification checklist:**
- [ ] All commands defined once (Principle I)
- [ ] Information at correct hierarchy level (Principle II)
- [ ] No unnecessary context loading (Principle III)
- [ ] All state files have version metadata (Principle IV)

**Version**: 2.0.1 | **Ratified**: 2026-01-03 | **Last Amended**: 2026-01-03
