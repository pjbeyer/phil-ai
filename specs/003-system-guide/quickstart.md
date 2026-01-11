# Quickstart: System Guide Implementation

**Feature**: 003-system-guide  
**Date**: 2026-01-11  
**Purpose**: Developer guide for implementing the System Guide feature

## Prerequisites

- phil-ai monorepo cloned
- Bun 1.x installed
- Dependencies installed (`bun install`)

## Implementation Order

```
1. shared/src/schemas/guide.ts     ← Start here
2. shared/src/guide/parser.ts
3. shared/src/guide/loader.ts
4. core/skills/guide/skill.json
5. core/skills/guide/SKILL.md
6. platforms/*/generator/transform.ts (update)
7. mcp/src/tools/guide.ts          ← End here
```

## Step 1: Add Guide Schema

Create `shared/src/schemas/guide.ts`:

```typescript
import { z } from "zod";

export const HierarchyLevel = ["global", "profile", "project"] as const;
export const PreferenceType = ["hard", "soft"] as const;
export const VerbosityLevel = ["silent", "brief", "verbose"] as const;

export const PreferenceIdRegex = /^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/;

export const PreferenceSchema = z.object({
  id: z.string().regex(PreferenceIdRegex),
  type: z.enum(PreferenceType).default("soft"),
  content: z.string().min(1),
  sourceLevel: z.enum(HierarchyLevel).optional(),
  active: z.boolean().default(true),
});

export type Preference = z.infer<typeof PreferenceSchema>;

// ... rest from contracts/guide-schema.ts
```

Export from `shared/src/schemas/index.ts`:

```typescript
export * from "./guide.js";
```

## Step 2: Add gray-matter Dependency

```bash
bun add gray-matter
bun add -d @types/gray-matter
```

## Step 3: Create Guide Parser

Create `shared/src/guide/parser.ts`:

```typescript
import matter from "gray-matter";
import { parse as parseYaml } from "yaml";
import { GuideFrontmatterSchema, PreferenceSchema } from "../schemas/guide.js";

export function parseGuide(content: string, filePath: string) {
  const { data, content: body } = matter(content);
  const frontmatter = GuideFrontmatterSchema.parse(data);
  const sections = extractSections(body);
  
  return {
    ...frontmatter,
    filePath,
    sections,
  };
}

function extractSections(body: string) {
  // Extract ## headings and yaml code blocks
  // Return GuideSection[]
}
```

## Step 4: Create Guide Loader

Create `shared/src/guide/loader.ts`:

```typescript
import { homedir } from "node:os";
import { join } from "node:path";
import { readFile, access } from "node:fs/promises";
import { parseGuide } from "./parser.js";

export async function discoverGuides(projectPath: string) {
  const paths = [
    { level: "global", path: join(homedir(), "Projects", "GUIDE.md") },
    // ... profile and project detection
  ];
  
  const found = [];
  for (const p of paths) {
    if (await fileExists(p.path)) {
      found.push(p);
    }
  }
  return found;
}

export async function loadMergedGuide(projectPath: string) {
  const paths = await discoverGuides(projectPath);
  const guides = await Promise.all(
    paths.map(async (p) => {
      const content = await readFile(p.path, "utf-8");
      return parseGuide(content, p.path);
    })
  );
  return mergeGuides(guides);
}
```

## Step 5: Create Guide Skill

Create `core/skills/guide/skill.json`:

```json
{
  "name": "guide",
  "version": "1.0.0",
  "description": "System guide for user preferences and workflow patterns",
  "category": "guide",
  "tags": ["preferences", "workflow", "context"],
  "allowedTools": ["Read", "Write", "Edit", "Glob"],
  "permissions": ["fs:read", "fs:write"],
  "entryPoint": "SKILL.md"
}
```

Create `core/skills/guide/SKILL.md`:

```markdown
# System Guide Skill

Load and apply user preferences from GUIDE.md files.

## When to Use

Use this skill when:
- Starting a new session (load preferences)
- User asks about their preferences
- Applying coding style or communication preferences

## Guide Locations

| Level | Path |
|-------|------|
| Global | ~/Projects/GUIDE.md |
| Profile | ~/Projects/{profile}/GUIDE.md |
| Project | {project}/GUIDE.md |

## Preference Types

- **hard**: Always follow (e.g., "no `any` types")
- **soft**: Default behavior, can override (e.g., "prefer concise responses")
```

## Step 6: Update Platform Generators

In `platforms/claude-code/generator/transform.ts`, add:

```typescript
case "guide":
  return [
    { name: "guide", description: "Show current preferences" },
    { name: "guide-validate", description: "Validate GUIDE.md" },
  ];
```

In `platforms/opencode/generator/transform.ts`, add:

```typescript
case "guide":
  return [
    {
      name: "get_guide",
      description: "Get merged user preferences",
      category: "guide",
      parameters: [
        { name: "project_path", type: "string", required: true },
      ],
    },
  ];
```

## Step 7: Add MCP Tool

Create `mcp/src/tools/guide.ts`:

```typescript
import { loadMergedGuide } from "@phil-ai/shared/guide";

export const guideTools = {
  get_guide: async ({ project_path }: { project_path: string }) => {
    const guide = await loadMergedGuide(project_path);
    return { preferences: guide.preferences };
  },
};
```

## Testing

Run tests after each step:

```bash
bun test tests/unit/guide/
bun test tests/unit/schemas/guide.test.ts
```

## Verification Checklist

- [ ] `bun test` passes
- [ ] `bun run lint` passes
- [ ] GUIDE.md can be parsed from any hierarchy level
- [ ] Preferences merge correctly (project > profile > global)
- [ ] Platform generators include guide skill
- [ ] MCP tool returns merged preferences

## Example GUIDE.md

```markdown
---
name: system-guide
version: "1.0.0"
verbosity: brief
---

# System Guide

## Code Style

```yaml
preferences:
  - id: code-style.explicit-types
    type: hard
    content: Always use explicit TypeScript types
```
```

## Common Issues

| Issue | Solution |
|-------|----------|
| gray-matter not found | Run `bun add gray-matter` |
| Schema validation fails | Check PreferenceIdRegex format |
| Guide not loading | Verify file exists at expected path |
