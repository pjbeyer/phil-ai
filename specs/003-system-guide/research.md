# Research: System Guide

**Feature**: 003-system-guide  
**Date**: 2026-01-11  
**Purpose**: Resolve technical unknowns before implementation

## Research Areas

### 1. YAML Frontmatter Parsing

**Decision**: Use `gray-matter` library for frontmatter parsing

**Rationale**:
- Industry-standard library for Markdown frontmatter
- Already used by Hugo, Jekyll, Gatsby, etc.
- Handles edge cases (multiline, special characters, nested YAML)
- TypeScript support via `@types/gray-matter`

**Alternatives Considered**:
- **Regex-based parser** (exists in constitution.md example): More fragile, doesn't handle complex YAML
- **yaml + custom parser**: More code to maintain, reinventing the wheel
- **remark-frontmatter**: Heavier, designed for full Markdown AST transformation

**Implementation Pattern**:
```typescript
import matter from 'gray-matter';

interface GuideFrontmatter {
  name: string;
  version: string;
  level: 'global' | 'profile' | 'project';
  verbosity: 'silent' | 'brief' | 'verbose';
}

function parseGuide(content: string): { frontmatter: GuideFrontmatter; body: string } {
  const { data, content: body } = matter(content);
  return { frontmatter: data as GuideFrontmatter, body };
}
```

---

### 2. Hierarchical File Discovery

**Decision**: Follow existing patterns in `shared/src/storage/directories.ts`

**Rationale**:
- Consistency with existing phil-ai architecture
- Reuse `getDataDir()`, `getConfigDir()` patterns
- Same hierarchy levels as learnings (global/profile/project)

**Implementation Pattern**:
```typescript
import { homedir } from 'node:os';
import { join } from 'node:path';
import { access } from 'node:fs/promises';

export async function discoverGuides(projectPath: string): Promise<GuidePath[]> {
  const guides: GuidePath[] = [];
  
  // Global: ~/Projects/GUIDE.md
  const globalPath = join(homedir(), 'Projects', 'GUIDE.md');
  if (await fileExists(globalPath)) {
    guides.push({ level: 'global', path: globalPath });
  }
  
  // Profile: ~/Projects/{profile}/GUIDE.md (detected from projectPath)
  const profilePath = extractProfilePath(projectPath);
  if (profilePath) {
    const guidePath = join(profilePath, 'GUIDE.md');
    if (await fileExists(guidePath)) {
      guides.push({ level: 'profile', path: guidePath });
    }
  }
  
  // Project: {project}/GUIDE.md
  const projectGuidePath = join(projectPath, 'GUIDE.md');
  if (await fileExists(projectGuidePath)) {
    guides.push({ level: 'project', path: projectGuidePath });
  }
  
  return guides;
}
```

---

### 3. Preference Merging Strategy

**Decision**: Project > Profile > Global with ID-based override

**Rationale**:
- Most specific wins (standard cascade pattern)
- ID-based matching allows partial overrides
- Consistent with CSS cascade, configuration management patterns

**Implementation Pattern**:
```typescript
function mergePreferences(guides: ParsedGuide[]): Preference[] {
  const preferenceMap = new Map<string, Preference>();
  
  // Process in order: global, profile, project
  for (const guide of guides.sort((a, b) => levelPriority(a.level) - levelPriority(b.level))) {
    for (const pref of guide.preferences) {
      preferenceMap.set(pref.id, { ...pref, sourceLevel: guide.level });
    }
  }
  
  return Array.from(preferenceMap.values());
}

function levelPriority(level: string): number {
  return { global: 0, profile: 1, project: 2 }[level] ?? 0;
}
```

---

### 4. Platform Generator Integration

**Decision**: Add "guide" as new skill category with custom injection logic

**Rationale**:
- Follows existing pattern (learning, docs, context, workflow)
- Generators already switch on `skill.category`
- Guide content injected into agent context at session start

**Claude Code Integration**:
- Guide content added to plugin manifest
- Injected into agent system prompt via skill mechanism
- Uses existing `skills/*/SKILL.md` pattern

**OpenCode Integration**:
- Guide exposed as MCP tool (`get_guide`)
- Config hook injects guide content
- Same source files, different discovery mechanism

---

### 5. Preference Structure

**Decision**: Structured YAML list in Markdown sections

**Rationale**:
- Human-readable (can edit with any text editor)
- Machine-parseable (YAML in code blocks)
- Groupable by section headings

**Format**:
```markdown
---
name: system-guide
version: "1.0.0"
level: project
verbosity: brief
---

# System Guide

## Code Style

```yaml
preferences:
  - id: code-style.explicit-types
    type: hard
    content: Always use explicit TypeScript types; avoid `any`
  
  - id: code-style.naming
    type: soft
    content: Prefer descriptive variable names over abbreviations
```

## Communication

```yaml
preferences:
  - id: comm.concise
    type: soft
    content: Keep responses concise; avoid unnecessary preamble
```
```

**Parsing Strategy**:
1. Parse frontmatter with gray-matter
2. Extract YAML code blocks from Markdown body
3. Parse each `preferences` list
4. Merge all preferences with section context

---

### 6. Agent Acknowledgment Verbosity

**Decision**: Three levels configurable in frontmatter

**Rationale**:
- User preference varies (some want transparency, others find it noisy)
- Default to `brief` (balance between transparency and noise)
- Can be overridden per-session if needed

**Levels**:
| Level | Behavior |
|-------|----------|
| `silent` | No acknowledgment; preferences applied invisibly |
| `brief` | Inline note: `[per guide: preference-id]` |
| `verbose` | Summary at session start + inline notes |

---

## Dependency Analysis

### New Dependencies

| Package | Purpose | Size | Maintenance |
|---------|---------|------|-------------|
| `gray-matter` | Frontmatter parsing | 15KB | Active, mature |

### Existing Dependencies Reused

| Package | From | Purpose |
|---------|------|---------|
| `zod` | @phil-ai/shared | Schema validation |
| `yaml` | @phil-ai/shared | YAML parsing (for preference blocks) |

---

## Open Questions Resolved

| Question | Resolution |
|----------|------------|
| How to parse frontmatter? | gray-matter library |
| Where to store guides? | Alongside AGENTS.md at hierarchy levels |
| How to merge preferences? | ID-based, project > profile > global |
| How to inject into agents? | Platform generators add to context |
| How verbose should agents be? | Configurable: silent/brief/verbose |

---

## Next Steps

1. ✅ Research complete
2. → Generate data-model.md with Zod schemas
3. → Generate contracts/ with TypeScript interfaces
4. → Generate quickstart.md for developers
