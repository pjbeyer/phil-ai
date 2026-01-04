# Data Model: Multi-Platform Phil-AI Scaffolding

**Date**: 2026-01-02  
**Feature**: 001-multiplatform-scaffolding

> **Architecture Note (Constitution v2.0.1)**: External plugin repos are the source of truth. This monorepo provides infrastructure only. "Reference Skills" are for development/testing; "External Plugin Repos" contain the actual implementations.

## Entities Overview

```
                        SOURCE OF TRUTH
┌────────────────────────────────────────────────────────┐
│                External Plugin Repos                    │
│  (phil-ai-learning, phil-ai-docs, phil-ai-context,     │
│   phil-ai-workflow)                                     │
└──────────────────────────┬─────────────────────────────┘
                           │
            ┌──────────────┼──────────────┐
            │ indexed by   │ scaffolds    │ uses
            ▼              ▼              ▼
┌─────────────────┐ ┌──────────────┐ ┌────────────────┐
│Marketplace Index│ │Reference Skill│ │  Private State │
│ (.claude-plugin │ │ (core/skills) │ │ (~/.local/     │
│  /marketplace.  │ │ dev/test only │ │  share/phil-ai)│
│  json)          │ └──────────────┘ └────────────────┘
└─────────────────┘                          │
        │                                    │
        └────────────────┬───────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  Configuration  │
                │(~/.config/      │
                │ phil-ai)        │
                └─────────────────┘
                         │
                         ▼
                ┌─────────────────┐
                │Component Version│
                └─────────────────┘
```

---

## Reference Skill

Platform-agnostic capability definitions stored in `core/skills/` for **development and testing only**. External plugin repos are the source of truth.

### Purpose

- **Development**: Test skill definitions locally before publishing to external repos
- **Testing**: Unit tests validate schema compliance
- **Documentation**: Reference for skill structure and capabilities
- **NOT production**: Actual plugins live in external repos

### Schema

```typescript
// shared/schemas/skill.ts
import { z } from 'zod';

export const ReferenceSkillSchema = z.object({
  // Identity
  name: z.string().regex(/^[a-z][a-z0-9-]*$/).max(64),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().max(500),
  
  // Categorization
  category: z.enum(['learning', 'docs', 'context', 'workflow']),
  tags: z.array(z.string()).default([]),
  
  // Capabilities
  allowedTools: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  
  // Content paths (relative to skill directory)
  entryPoint: z.string().default('SKILL.md'),
  references: z.array(z.string()).optional(),
  scripts: z.array(z.string()).optional(),
  
  // Metadata
  author: z.object({
    name: z.string(),
    email: z.string().email().optional()
  }).optional(),
  repository: z.string().url().optional(),
  license: z.string().default('MIT')
});

export type ReferenceSkill = z.infer<typeof ReferenceSkillSchema>;
```

### File Structure

```
core/skills/{skill-name}/
├── skill.json       # Metadata (CoreSkillSchema)
├── SKILL.md         # Entry point (Agent Skills spec)
├── reference.md     # Optional: progressive disclosure
└── scripts/         # Optional: utility scripts
    └── *.sh
```

### State Transitions

```
[Draft] ──validate──▶ [Valid] ──generate──▶ [Published]
   │                     │                      │
   │                     │                      │
   └──────fix────────────┘                      │
                                                │
[Deprecated] ◀──────deprecate──────────────────┘
```

---

## External Plugin Repository

Source of truth for each plugin, maintained as separate GitHub repos. Each repo supports both Claude Code and OpenCode (dual-platform native per Constitution v2.0.1).

### External Repos (Source of Truth)

| Repo | URL | Description |
|------|-----|-------------|
| phil-ai-learning | github.com/pjbeyer/phil-ai-learning | Capture and implement learnings |
| phil-ai-docs | github.com/pjbeyer/phil-ai-docs | Hierarchical documentation |
| phil-ai-context | github.com/pjbeyer/phil-ai-context | AGENTS.md optimization |
| phil-ai-workflow | github.com/pjbeyer/phil-ai-workflow | Work tracking and git integration |

### Schema (for marketplace index)

```typescript
// shared/schemas/plugin.ts
import { z } from 'zod';

export const ExternalPluginSchema = z.object({
  // Identity
  name: z.string(),
  version: z.string(),
  description: z.string(),
  
  // Repository
  repository: z.string().url(),
  
  // Platform support
  platforms: z.object({
    claudeCode: z.boolean().default(true),
    opencode: z.boolean().default(false) // Added by scaffold command
  }),
  
  // Metadata
  author: z.object({
    name: z.string(),
    email: z.string().email().optional()
  }).optional(),
  license: z.string().default('MIT'),
  keywords: z.array(z.string()).default([])
});

export type ExternalPlugin = z.infer<typeof ExternalPluginSchema>;
```

### External Repo Structure (Claude Code + OpenCode)

```
phil-ai-learning/                  # External repo (source of truth)
├── .claude-plugin/
│   └── plugin.json                # Claude Code manifest
├── commands/
│   └── learn.md                   # Claude Code slash commands
├── skills/
│   └── capture-learning/
│       └── SKILL.md               # Claude Code model-invoked skills
├── scripts/
│   └── find-learnings.sh
├── config/
│   └── storage-structure.json
├── opencode/                      # Added by scaffold command (feature 002)
│   ├── plugin.ts                  # OpenCode entry point
│   └── tools/                     # OpenCode tools (derived from skills/)
│       └── capture-learning.ts
└── README.md
```

---

## Marketplace Index

Index file generated by this monorepo, pointing to external plugin repos.

### Schema

```typescript
// shared/schemas/marketplace.ts
import { z } from 'zod';

export const MarketplaceIndexSchema = z.object({
  name: z.string(),
  version: z.string(),
  description: z.string(),
  plugins: z.array(ExternalPluginSchema),
  generatedAt: z.string().datetime()
});

export type MarketplaceIndex = z.infer<typeof MarketplaceIndexSchema>;
```

### File Location

```
.claude-plugin/
└── marketplace.json     # Generated by `bunx phil-ai generate`
```

### Example Content

```json
{
  "name": "phil-ai",
  "version": "1.0.0",
  "description": "Cross-platform AI plugin system",
  "plugins": [
    {
      "name": "phil-ai-learning",
      "version": "1.1.1",
      "description": "Capture and implement learnings",
      "repository": "https://github.com/pjbeyer/phil-ai-learning",
      "platforms": { "claudeCode": true, "opencode": true },
      "keywords": ["learning", "continuous-improvement"]
    }
  ],
  "generatedAt": "2026-01-03T12:00:00Z"
}

---

## Private State

User-specific data stored at `~/.local/share/phil-ai/`.

### Schema

```typescript
// shared/schemas/state.ts
import { z } from 'zod';

// Base schema for all stored data
export const VersionedDataSchema = z.object({
  _version: z.string().regex(/^\d+\.\d+\.\d+$/),
  _created: z.string().datetime(),
  _modified: z.string().datetime()
});

// Learning entry
export const LearningSchema = VersionedDataSchema.extend({
  id: z.string().uuid(),
  title: z.string(),
  category: z.string(),
  level: z.enum(['global', 'profile', 'project', 'agent']),
  status: z.enum(['open', 'in-progress', 'testing', 'blocked', 'closed']),
  priority: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']),
  impact: z.enum(['high', 'medium', 'low']),
  effort: z.enum(['high', 'medium', 'low']),
  tags: z.array(z.string()),
  content: z.object({
    problem: z.string(),
    solution: z.string(),
    documentationPath: z.string().optional()
  }),
  closedAt: z.string().datetime().optional()
});

// Pattern entry
export const PatternSchema = VersionedDataSchema.extend({
  id: z.string().uuid(),
  name: z.string(),
  category: z.string(),
  level: z.enum(['global', 'profile', 'project', 'agent']),
  extractedFrom: z.array(z.string()), // learning IDs
  content: z.string()
});

// State index
export const StateIndexSchema = VersionedDataSchema.extend({
  learnings: z.record(z.string(), z.string()), // id -> filepath
  patterns: z.record(z.string(), z.string()),
  lastSync: z.string().datetime().optional()
});

export type Learning = z.infer<typeof LearningSchema>;
export type Pattern = z.infer<typeof PatternSchema>;
export type StateIndex = z.infer<typeof StateIndexSchema>;
```

### File Structure

```
~/.local/share/phil-ai/
├── index.json           # StateIndex: quick lookup
├── learnings/
│   ├── global/
│   │   └── {id}.json    # Learning entries
│   ├── profile/
│   │   └── {profile}/
│   │       └── {id}.json
│   ├── project/
│   │   └── {id}.json
│   └── agent/
│       └── {id}.json
├── patterns/
│   └── {category}/
│       └── {id}.json
└── .lock/               # Lock directory (proper-lockfile)
```

### Validation Rules

- All files MUST include `_version`, `_created`, `_modified`
- UUIDs MUST be v4 format
- Datetime MUST be ISO 8601 format
- Level MUST match directory structure
- Index MUST be updated on every write

---

## Configuration

User preferences stored at `~/.config/phil-ai/`.

### Schema

```typescript
// shared/schemas/config.ts
import { z } from 'zod';

export const ConfigSchema = z.object({
  _version: z.string().regex(/^\d+\.\d+\.\d+$/),
  
  // User preferences
  defaults: z.object({
    priority: z.enum(['P0', 'P1', 'P2', 'P3', 'P4']).default('P3'),
    impact: z.enum(['high', 'medium', 'low']).default('medium'),
    effort: z.enum(['high', 'medium', 'low']).default('medium')
  }).default({}),
  
  // Profile mappings
  profiles: z.record(z.string(), z.object({
    path: z.string(),
    categories: z.array(z.string())
  })).default({}),
  
  // Platform settings
  platforms: z.object({
    claudeCode: z.object({
      enabled: z.boolean().default(true),
      marketplacePath: z.string().optional()
    }).default({}),
    opencode: z.object({
      enabled: z.boolean().default(true),
      pluginPath: z.string().optional()
    }).default({})
  }).default({}),
  
  // MCP settings
  mcp: z.object({
    port: z.number().default(3000),
    host: z.string().default('localhost')
  }).default({})
});

export type Config = z.infer<typeof ConfigSchema>;
```

### File Structure

```
~/.config/phil-ai/
├── config.yaml          # Main configuration
├── profiles/            # Profile-specific overrides
│   └── {profile}.yaml
└── .credentials/        # Sensitive data (gitignored)
    └── *.json
```

### Default Configuration

```yaml
# config.yaml
_version: "1.0.0"

defaults:
  priority: P3
  impact: medium
  effort: medium

profiles:
  pjbeyer:
    path: ~/Projects/pjbeyer
    categories: [tools, patterns, optimizations]
  work:
    path: ~/Projects/work
    categories: [tools, patterns, integrations]

platforms:
  claudeCode:
    enabled: true
  opencode:
    enabled: true

mcp:
  port: 3000
  host: localhost
```

---

## Component Version

Version metadata for compatibility checking.

### Schema

```typescript
// shared/schemas/version.ts
import { z } from 'zod';

export const ComponentVersionSchema = z.object({
  component: z.enum(['core', 'cli', 'mcp', 'claude-code-generator', 'opencode-generator']),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  minCompatible: z.string().regex(/^\d+\.\d+\.\d+$/).optional(),
  installedAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const VersionManifestSchema = z.object({
  _version: z.string(),
  components: z.array(ComponentVersionSchema),
  dataSchemaVersion: z.string(),
  lastCheck: z.string().datetime().optional()
});

export type ComponentVersion = z.infer<typeof ComponentVersionSchema>;
export type VersionManifest = z.infer<typeof VersionManifestSchema>;
```

### Version File Location

```
~/.local/share/phil-ai/
└── version.json         # VersionManifest
```

### Compatibility Matrix

| Component | Data Schema | Notes |
|-----------|-------------|-------|
| core 1.x | 1.0.x | Initial release |
| cli 1.x | 1.0.x | Must match core |
| mcp 1.x | 1.0.x | Must match core |
| generators 1.x | N/A | Output only |

### Version Check Logic

```typescript
function checkCompatibility(manifest: VersionManifest): ValidationResult {
  const errors: string[] = [];
  
  // All components must be present
  const required = ['core', 'cli', 'mcp'];
  for (const comp of required) {
    if (!manifest.components.find(c => c.component === comp)) {
      errors.push(`Missing required component: ${comp}`);
    }
  }
  
  // Data schema must be compatible
  const coreVersion = manifest.components.find(c => c.component === 'core')?.version;
  if (coreVersion && !semverSatisfies(manifest.dataSchemaVersion, `^${coreVersion}`)) {
    errors.push(`Data schema ${manifest.dataSchemaVersion} incompatible with core ${coreVersion}`);
  }
  
  return { valid: errors.length === 0, errors };
}
```

---

## Entity Relationships

| From | To | Relationship | Cardinality |
|------|-----|--------------|-------------|
| Marketplace Index | External Plugin Repo | references | 1:N |
| External Plugin Repo | Private State | reads/writes | N:N |
| Reference Skill | External Plugin Repo | mirrors (dev/test) | 1:1 |
| Scaffold Command | External Plugin Repo | adds OpenCode support | 1:1 |
| Configuration | External Plugin Repo | configures | 1:N |
| Component Version | All | validates | 1:N |
| Learning | Pattern | extracted to | N:N |
| Pattern | Learning | derived from | N:N |

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL (Source of Truth)                    │
│                                                                  │
│  phil-ai-learning/  phil-ai-docs/  phil-ai-context/  phil-ai-   │
│                                                      workflow/   │
└──────────────────────────────┬──────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
    │  generate   │    │   scaffold   │    │    MCP      │
    │  command    │    │   command    │    │   server    │
    │             │    │  (feat 002)  │    │             │
    └──────┬──────┘    └──────┬───────┘    └──────┬──────┘
           │                  │                   │
           ▼                  ▼                   ▼
    ┌─────────────┐    ┌──────────────┐    ┌─────────────┐
    │ marketplace │    │ opencode/    │    │ Private     │
    │ .json       │    │ directory    │    │ State       │
    │             │    │ in ext repo  │    │             │
    └─────────────┘    └──────────────┘    └─────────────┘
```

---

## Migration Strategy

When schema versions change:

1. **Detect**: CLI checks version.json on startup
2. **Backup**: Copy existing data to `~/.local/share/phil-ai/backup/{timestamp}/`
3. **Migrate**: Run migration script for version delta
4. **Validate**: Verify all data passes new schema validation
5. **Commit**: Update version.json with new versions

Migrations MUST be reversible where possible.
