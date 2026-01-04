# Research: Multi-Platform Phil-AI Scaffolding

**Date**: 2026-01-02  
**Feature**: 001-multiplatform-scaffolding

> **Architecture Evolution Note (2026-01-03)**: This research was conducted before Constitution v2.0.1 clarified the source-of-truth architecture. Key clarification: **External plugin repos remain the source of truth** (phil-ai-learning, phil-ai-docs, phil-ai-context, phil-ai-workflow). This monorepo provides **infrastructure only**: CLI, MCP server, shared utilities, and marketplace index. The `scaffold` command (feature 002) adds OpenCode support to external repos.

## Research Topics

### 1. Bun Monorepo/Workspace Configuration

**Decision**: Use Bun native workspaces with glob patterns

**Rationale**: Bun has first-class workspace support compatible with npm/yarn conventions. Native workspace support eliminates need for additional tooling.

**Alternatives Considered**:
- pnpm workspaces: Slower installation, more complex setup
- Turborepo: Overkill for 4-package monorepo
- Nx: Enterprise complexity not needed

**Configuration**:

```json
// Root package.json
{
  "name": "phil-ai",
  "private": true,
  "workspaces": ["packages/*"],
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "^5.0.0"
  }
}
```

```toml
# bunfig.toml
[install]
exact = true

[install.lockfile]
save = true
```

**Key Patterns**:
- Use `workspace:*` for inter-package dependencies
- Mark root as `private: true`
- Glob patterns: `packages/*` for all subdirectories
- Run scripts: `bun --filter <package> <script>`

---

### 2. MCP Server Implementation (TypeScript)

**Decision**: Use `@modelcontextprotocol/sdk` with high-level McpServer API

**Rationale**: Official SDK provides type safety, Zod schema validation, and standard patterns. High-level API reduces boilerplate.

**Alternatives Considered**:
- Low-level Server class: More control but more boilerplate
- Custom implementation: Violates MCP spec compliance

**Implementation Pattern**:

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import * as z from 'zod';

const server = new McpServer({
  name: 'phil-ai-server',
  version: '1.0.0'
});

// Register tool with Zod schemas
server.registerTool(
  'capture-learning',
  {
    title: 'Capture Learning',
    description: 'Capture a learning at appropriate hierarchy level',
    inputSchema: {
      title: z.string().describe('Learning title'),
      category: z.string().describe('Category'),
      level: z.enum(['global', 'profile', 'project', 'agent'])
    },
    outputSchema: {
      success: z.boolean(),
      path: z.string()
    }
  },
  async ({ title, category, level }) => {
    // Implementation
    return {
      content: [{ type: 'text', text: 'Learning captured' }],
      structuredContent: { success: true, path: '/path/to/learning.md' }
    };
  }
);

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Key Patterns**:
- Use `McpServer` for high-level API
- Define schemas with Zod
- Support both text and structured output
- Use stdio transport for CLI invocation

---

### 3. File Locking for Concurrent Access

**Decision**: Use `proper-lockfile` library with exponential backoff

**Rationale**: Industry-standard, cross-platform (macOS/Linux), uses directory-based locks (atomic on all OSes).

**Alternatives Considered**:
- `lockfile`: Older, less robust
- `flock`: Not cross-platform
- Custom implementation: Reinventing the wheel

**Implementation Pattern**:

```typescript
import lockfile from 'proper-lockfile';
import { readFile, writeFile } from 'fs/promises';

const LOCK_OPTIONS = {
  retries: {
    retries: 5,
    factor: 2,
    minTimeout: 100,
    maxTimeout: 1000
  },
  stale: 10000 // 10 seconds
};

async function readWithLock<T>(path: string): Promise<T> {
  const release = await lockfile.lock(path, LOCK_OPTIONS);
  try {
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  } finally {
    await release();
  }
}

async function writeWithLock<T>(path: string, data: T): Promise<void> {
  const release = await lockfile.lock(path, LOCK_OPTIONS);
  try {
    await writeFile(path, JSON.stringify(data, null, 2));
  } finally {
    await release();
  }
}
```

**Key Patterns**:
- Exponential backoff: 5 retries, factor 2
- Stale lock detection: 10 seconds
- Always release in finally block
- Lock file creates `.lock` directory

---

### 4. Agent Skills Specification

**Decision**: Follow agentskills.io spec for core skill definitions

**Rationale**: Standard format ensures compatibility with Claude Code model-invoked skills. Already used by existing phil-ai plugins.

**Alternatives Considered**:
- Custom format: Would break Claude Code compatibility
- OpenAI function calling format: Not compatible with Claude Code skills

**SKILL.md Format**:

```markdown
---
name: skill-name
description: Brief description for model to decide when to invoke
allowed-tools: Read, Write, Bash(path:*)
---

# Skill Name

Detailed instructions for the skill...

## Workflow

### Step 1: ...
```

**Required Frontmatter**:
- `name`: Unique identifier (lowercase, hyphens)
- `description`: Model uses this to decide invocation

**Optional Frontmatter**:
- `allowed-tools`: Pre-authorized tools
- `version`: Skill version

**Directory Structure**:
```
skills/
└── skill-name/
    ├── SKILL.md      # Required: entry point
    └── reference.md  # Optional: progressive disclosure
```

---

### 5. Existing Plugin Analysis

**Decision**: External plugin repos are source of truth; monorepo provides infrastructure

**Rationale**: 4 existing plugins work correctly as Claude Code plugins. Per Constitution v2.0.1, these external repos remain authoritative. The `scaffold` command (feature 002) will add OpenCode support to each repo, making them dual-platform native.

**External Plugin Repos** (source of truth):
- `phil-ai-learning` - https://github.com/pjbeyer/phil-ai-learning
- `phil-ai-docs` - https://github.com/pjbeyer/phil-ai-docs
- `phil-ai-context` - https://github.com/pjbeyer/phil-ai-context
- `phil-ai-workflow` - https://github.com/pjbeyer/phil-ai-workflow

**Claude Code Plugin Structure** (from phil-ai-learning):
```
phil-ai-learning/           # External repo (source of truth)
├── .claude-plugin/
│   └── plugin.json         # Claude Code manifest
├── commands/
│   └── learn.md            # Slash commands
├── skills/
│   └── capture-learning/
│       └── SKILL.md        # Model-invoked skills
├── scripts/
│   └── find-learnings.sh   # Utility scripts
├── config/
│   └── storage-structure.json
├── opencode/               # Added by scaffold command (feature 002)
│   └── plugin.ts           # OpenCode plugin entry
└── README.md
```

**plugin.json Format**:
```json
{
  "name": "phil-ai-learning",
  "version": "1.1.1",
  "description": "...",
  "author": { "name": "Phil Beyer", "email": "..." },
  "license": "MIT",
  "repository": "https://github.com/pjbeyer/phil-ai-learning",
  "keywords": ["learning", "continuous-improvement"]
}
```

---

### 6. OpenCode Plugin Structure

**Decision**: External repos support both platforms; scaffold command adds OpenCode support

**Rationale**: OpenCode uses programmatic plugins vs Claude Code's declarative approach. The `scaffold` command (feature 002) generates the `opencode/` directory in external plugin repos.

**OpenCode Plugin Structure** (added to external repos by scaffold):
```typescript
// phil-ai-learning/opencode/plugin.ts (generated by scaffold command)
import type { Plugin } from "@opencode-ai/plugin";

export const PhilAILearningPlugin: Plugin = async ({ project, client, $ }) => {
  return {
    // Event hooks
    "session.created": async () => { /* initialize */ },
    
    // Custom tools (derived from skills/)
    tool: {
      "capture-learning": tool({
        description: "Capture a learning",
        args: {
          title: tool.schema.string(),
          category: tool.schema.string()
        },
        async execute(args, ctx) {
          // Implementation matches skill behavior
          return "Learning captured";
        }
      })
    }
  };
};
```

**Dual-Platform External Repo Structure** (after scaffold):
```
phil-ai-learning/           # External repo with both platform formats
├── .claude-plugin/         # Claude Code (existing)
│   └── plugin.json
├── commands/               # Claude Code commands
├── skills/                 # Claude Code skills (source for OpenCode tools)
├── opencode/               # OpenCode (added by scaffold)
│   ├── plugin.ts           # Plugin entry point
│   └── tools/              # Generated from skills/
└── README.md
```

**Key Differences from Claude Code**:
| Aspect | Claude Code | OpenCode |
|--------|-------------|----------|
| Format | Markdown + JSON | TypeScript |
| Invocation | Model-decided (skills) | Explicit (tools) |
| Events | JSON hooks config | Code subscriptions |
| Installation | Marketplace | Local files / npm |
| Source | External repo | External repo (scaffold-generated) |

---

---

### 7. Marketplace Architecture

**Decision**: Generate marketplace.json index pointing to external plugin repos

**Rationale**: Per Constitution v2.0.1, external repos are source of truth. The `generate` command produces a marketplace index that points to these repos, enabling plugin discovery without duplicating plugin code.

**Marketplace Index Structure**:
```json
// .claude-plugin/marketplace.json (generated by `bunx phil-ai generate`)
{
  "name": "phil-ai",
  "version": "1.0.0",
  "plugins": [
    {
      "name": "phil-ai-learning",
      "repository": "https://github.com/pjbeyer/phil-ai-learning",
      "description": "Capture and implement learnings with hierarchical storage",
      "version": "1.1.1"
    },
    {
      "name": "phil-ai-docs",
      "repository": "https://github.com/pjbeyer/phil-ai-docs",
      "description": "Hierarchical documentation with audience optimization",
      "version": "1.0.0"
    }
    // ... additional plugins
  ]
}
```

**Plugin Discovery Workflow**:
1. User runs `/plugin marketplace add pjbeyer/phil-ai`
2. Claude Code fetches `.claude-plugin/marketplace.json` from this monorepo
3. Marketplace lists available plugins with their external repo URLs
4. User installs individual plugins: `/plugin install phil-ai-learning@phil-ai`
5. Claude Code clones from external repo URL

**Benefits**:
- External repos remain authoritative
- Marketplace provides discovery without duplication
- Version compatibility tracked in marketplace index
- Easy to add new plugins by updating index

---

## Summary

All NEEDS CLARIFICATION items resolved:

| Topic | Decision | Confidence |
|-------|----------|------------|
| Monorepo setup | Bun workspaces | High |
| MCP server | @modelcontextprotocol/sdk | High |
| File locking | proper-lockfile | High |
| Core skills | Agent Skills spec | High |
| Claude Code gen | Marketplace index only | High |
| OpenCode gen | Scaffold to external repos | High |
| Architecture | External repos = source of truth | High |

**Ready for Phase 1: Design & Contracts**
