# Research: Multi-Platform Phil-AI Scaffolding

**Date**: 2026-01-02  
**Feature**: 001-multiplatform-scaffolding

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

**Decision**: Preserve existing plugin structure, generate compatible output

**Rationale**: 4 existing plugins work correctly. Generators must produce identical structure.

**Claude Code Plugin Structure** (from phil-ai-learning):
```
plugin/
├── .claude-plugin/
│   └── plugin.json       # Manifest only
├── commands/
│   └── learn.md          # Slash commands
├── skills/
│   └── capture-learning/
│       └── SKILL.md      # Model-invoked skills
├── scripts/
│   └── find-learnings.sh # Utility scripts
├── config/
│   └── storage-structure.json
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

**Decision**: Generate TypeScript modules following OpenCode plugin spec

**Rationale**: OpenCode uses programmatic plugins vs Claude Code's declarative approach.

**OpenCode Plugin Structure**:
```typescript
// .opencode/plugin/phil-ai.ts
import type { Plugin } from "@opencode-ai/plugin";

export const PhilAIPlugin: Plugin = async ({ project, client, $ }) => {
  return {
    // Event hooks
    "session.created": async () => { /* initialize */ },
    
    // Custom tools
    tool: {
      "capture-learning": tool({
        description: "Capture a learning",
        args: {
          title: tool.schema.string(),
          category: tool.schema.string()
        },
        async execute(args, ctx) {
          // Implementation
          return "Learning captured";
        }
      })
    }
  };
};
```

**Key Differences from Claude Code**:
| Aspect | Claude Code | OpenCode |
|--------|-------------|----------|
| Format | Markdown + JSON | TypeScript |
| Invocation | Model-decided (skills) | Explicit (tools) |
| Events | JSON hooks config | Code subscriptions |
| Installation | Marketplace | Local files / npm |

---

## Summary

All NEEDS CLARIFICATION items resolved:

| Topic | Decision | Confidence |
|-------|----------|------------|
| Monorepo setup | Bun workspaces | High |
| MCP server | @modelcontextprotocol/sdk | High |
| File locking | proper-lockfile | High |
| Core skills | Agent Skills spec | High |
| Claude Code gen | Match existing structure | High |
| OpenCode gen | TypeScript Plugin modules | High |

**Ready for Phase 1: Design & Contracts**
