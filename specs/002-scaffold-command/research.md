# Research: Scaffold Command

**Feature**: 002-scaffold-command  
**Date**: 2026-01-11

## Research Questions

### 1. OpenCode Plugin API Structure

**Question**: What is the exact Plugin type signature and how are tools registered?

**Decision**: Use the Plugin type pattern from `@opencode-ai/plugin`

**Rationale**: Based on research of the superpowers plugin and OpenCode documentation:
- Plugin exports an async function receiving `{ client, directory, $ }` context
- Returns object with `tool`, `event`, and/or `config` hooks
- Tools use `tool()` helper from `@opencode-ai/plugin/tool`

**Evidence** (from `superpowers/.opencode/plugin/superpowers.js`):
```typescript
import { tool } from '@opencode-ai/plugin/tool';

export const SuperpowersPlugin = async ({ client, directory }) => {
  return {
    tool: {
      use_skill: tool({
        description: 'Load and read a specific skill',
        args: {
          skill_name: tool.schema.string().describe('Name of skill')
        },
        execute: async (args, context) => { ... }
      })
    },
    event: async ({ event }) => {
      if (event.type === 'session.created') { ... }
    }
  };
};
```

**Alternatives Considered**:
- Direct exports without wrapper: Rejected - doesn't integrate with OpenCode's plugin system
- MCP-only approach: Rejected - spec requires native plugin support

---

### 2. Command Registration via Config Hook

**Question**: How do plugins register slash commands with OpenCode?

**Decision**: Use the `config` hook to register commands from `commands/*.md`

**Rationale**: OpenCode's config hook allows plugins to modify the runtime configuration, including registering commands. The constitution template (lines 282-300) shows this pattern.

**Evidence** (from constitution.md):
```typescript
export const Plugin: Plugin = async () => {
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
        };
      }
    },
  };
};
```

**Alternatives Considered**:
- Tool-based commands: Rejected - commands should be slash commands, not tools
- Hardcoded commands: Rejected - must load from `commands/*.md` at runtime

---

### 3. Package.json Structure for Bun + ESM

**Question**: What package.json structure works for TypeScript npm packages built with Bun?

**Decision**: Use ESM with explicit exports field, Bun build target

**Rationale**: Based on Bun documentation and existing phil-ai package patterns:

**Template** (from constitution.md lines 305-344):
```json
{
  "name": "{{packageName}}",
  "version": "{{version}}",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    }
  },
  "files": ["dist", "commands"],
  "scripts": {
    "build": "bun build ./src/index.ts --outdir dist --target bun",
    "prepublishOnly": "bun run build"
  },
  "dependencies": {
    "@opencode-ai/plugin": "^1.0.85"
  }
}
```

**Key Decisions**:
- Include `commands/` in `files` array so npm package includes command definitions
- Use `bun build` with `--target bun` for Bun runtime optimization
- Pin `@opencode-ai/plugin` to stable version

**Alternatives Considered**:
- tsc build: Rejected - Bun build is faster and produces smaller output
- Node target: Rejected - OpenCode runs on Bun

---

### 4. CLI Command Pattern

**Question**: How should the scaffold command follow existing CLI patterns?

**Decision**: Follow `cli/src/commands/{name}/index.ts` pattern with `runScaffold` export

**Rationale**: Existing commands (validate, generate, install) use this pattern consistently:

**Evidence** (from `cli/src/commands/generate/index.ts`):
```typescript
import type { ParsedArgs } from "../../lib/args.js";
import { getBoolFlag, getStringFlag } from "../../lib/args.js";
import { bold, success, info, error } from "../../lib/output.js";

export interface GenerateOptions {
  platform: string;
  dryRun: boolean;
}

function parseGenerateOptions(args: ParsedArgs): GenerateOptions {
  return {
    platform: getStringFlag(args, "platform") ?? "all",
    dryRun: getBoolFlag(args, "dry-run"),
  };
}

export async function runGenerate(args: ParsedArgs): Promise<void> {
  // Implementation
}
```

**Pattern Applied to Scaffold**:
```typescript
export interface ScaffoldOptions {
  path: string;
  dryRun: boolean;
  force: boolean;
}

function parseScaffoldOptions(args: ParsedArgs): ScaffoldOptions {
  return {
    path: getStringFlag(args, "path") ?? process.cwd(),
    dryRun: getBoolFlag(args, "dry-run"),
    force: getBoolFlag(args, "force"),
  };
}

export async function runScaffold(args: ParsedArgs): Promise<void> {
  // Implementation
}
```

---

### 5. Dev Marketplace Naming Convention

**Question**: How should the local testing marketplace be named?

**Decision**: Use `<plugin-name>-dev` suffix for marketplace name

**Rationale**: Based on research of `superpowers-developing-for-claude-code`:

**Evidence** (from `.claude-plugin/marketplace.json`):
```json
{
  "name": "superpowers-developing-for-claude-code-dev",
  "plugins": [{
    "name": "superpowers-developing-for-claude-code",
    "source": "./"
  }]
}
```

**Installation Pattern**:
```bash
/plugin marketplace add /path/to/plugin
/plugin install my-plugin@my-plugin-dev
```

**Key Insight**: The `-dev` suffix is on the **marketplace**, not the plugin. This allows the same plugin to be installed from local dev or published npm without name conflicts.

---

### 6. Skill to Tool Transformation

**Question**: How should Claude Code skills be represented in OpenCode?

**Decision**: Generate tool stubs with metadata, placeholder execute function

**Rationale**: Skills contain model instructions, not executable code. Per spec clarification:
- Extract `name` and `description` from SKILL.md frontmatter
- Generate tool with those metadata fields
- Execute function returns "not implemented" placeholder
- User must implement actual tool logic

**Template**:
```typescript
tool({
  description: '{{skillDescription}}',
  args: {
    // Extracted from SKILL.md if present
  },
  execute: async (args, context) => {
    return `Tool "${skillName}" not yet implemented. See skills/${skillName}/SKILL.md for instructions.`;
  }
})
```

**Alternatives Considered**:
- Auto-generate execute from SKILL.md: Rejected - skills are instructions, not code
- Skip skills entirely: Rejected - spec requires skill support
- Convert to MCP tools: Rejected - native tools preferred for performance

---

## Unresolved Questions

None. All technical decisions resolved.

## References

1. Constitution templates: `.specify/memory/constitution.md` lines 206-366
2. Superpowers OpenCode plugin: `superpowers/.opencode/plugin/superpowers.js`
3. Dev marketplace pattern: `superpowers-developing-for-claude-code/.claude-plugin/marketplace.json`
4. CLI command patterns: `cli/src/commands/*/index.ts`
5. OpenCode README: `superpowers/docs/README.opencode.md`
