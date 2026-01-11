# Data Model: System Guide

**Feature**: 003-system-guide  
**Date**: 2026-01-11  
**Purpose**: Define entities, attributes, and relationships

## Entity Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        SystemGuide                           │
├─────────────────────────────────────────────────────────────┤
│ name: string                                                 │
│ version: string (semver)                                     │
│ level: HierarchyLevel                                        │
│ verbosity: VerbosityLevel                                    │
│ filePath: string                                             │
│ sections: GuideSection[]                                     │
├─────────────────────────────────────────────────────────────┤
│ + getPreferences(): Preference[]                             │
│ + getPreferenceById(id: string): Preference | undefined      │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ contains
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       GuideSection                           │
├─────────────────────────────────────────────────────────────┤
│ name: string                                                 │
│ heading: string                                              │
│ preferences: Preference[]                                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ contains
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Preference                            │
├─────────────────────────────────────────────────────────────┤
│ id: string (dot-notation slug)                               │
│ type: PreferenceType                                         │
│ content: string                                              │
│ sourceLevel?: HierarchyLevel (set during merge)              │
│ active: boolean (default: true)                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      MergedGuide                             │
├─────────────────────────────────────────────────────────────┤
│ preferences: Preference[]                                    │
│ sources: GuidePath[]                                         │
│ verbosity: VerbosityLevel                                    │
│ mergedAt: string (ISO 8601)                                  │
├─────────────────────────────────────────────────────────────┤
│ + findByIdPrefix(prefix: string): Preference[]               │
│ + filterByType(type: PreferenceType): Preference[]           │
│ + getHardPreferences(): Preference[]                         │
│ + getSoftPreferences(): Preference[]                         │
└─────────────────────────────────────────────────────────────┘
```

## Enumerations

### HierarchyLevel

```typescript
const HierarchyLevel = ['global', 'profile', 'project'] as const;
type HierarchyLevelType = typeof HierarchyLevel[number];
```

| Value | Description | File Location |
|-------|-------------|---------------|
| `global` | Cross-profile preferences | `~/Projects/GUIDE.md` |
| `profile` | Profile-specific preferences | `~/Projects/{profile}/GUIDE.md` |
| `project` | Project-specific preferences | `{project}/GUIDE.md` |

### PreferenceType

```typescript
const PreferenceType = ['hard', 'soft'] as const;
type PreferenceTypeType = typeof PreferenceType[number];
```

| Value | Description | Agent Behavior |
|-------|-------------|----------------|
| `hard` | Rule to always follow | Must comply; divergence requires explicit override |
| `soft` | Default that can be overridden | Applied unless user specifies otherwise |

### VerbosityLevel

```typescript
const VerbosityLevel = ['silent', 'brief', 'verbose'] as const;
type VerbosityLevelType = typeof VerbosityLevel[number];
```

| Value | Description | Agent Behavior |
|-------|-------------|----------------|
| `silent` | No acknowledgment | Preferences applied invisibly |
| `brief` | Inline notes | `[per guide: preference-id]` |
| `verbose` | Full transparency | Session start summary + inline notes |

## Entity Definitions

### SystemGuide

The primary container parsed from a single `GUIDE.md` file.

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | - | Guide identifier (usually "system-guide") |
| `version` | string | Yes | "1.0.0" | Semver version |
| `level` | HierarchyLevel | Yes | - | Hierarchy level (from file location) |
| `verbosity` | VerbosityLevel | No | "brief" | Agent acknowledgment verbosity |
| `filePath` | string | Yes | - | Absolute path to source file |
| `sections` | GuideSection[] | No | [] | Parsed sections from Markdown body |

### GuideSection

A logical grouping of preferences extracted from Markdown headings.

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Normalized section name (lowercase, hyphenated) |
| `heading` | string | Yes | Original Markdown heading text |
| `preferences` | Preference[] | Yes | Preferences defined in this section |

### Preference

An individual preference rule.

| Attribute | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `id` | string | Yes | - | Unique dot-notation slug (e.g., "code-style.explicit-types") |
| `type` | PreferenceType | Yes | "soft" | Hard rule or soft default |
| `content` | string | Yes | - | Natural language description |
| `sourceLevel` | HierarchyLevel | No | - | Set during merge to track origin |
| `active` | boolean | No | true | Whether preference is active |

### MergedGuide

The result of merging guides from all hierarchy levels.

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `preferences` | Preference[] | Yes | Merged preferences (deduplicated by ID) |
| `sources` | GuidePath[] | Yes | Source files that contributed |
| `verbosity` | VerbosityLevel | Yes | Effective verbosity (from lowest level) |
| `mergedAt` | string | Yes | ISO 8601 timestamp of merge |

### GuidePath

Reference to a guide file.

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `level` | HierarchyLevel | Yes | Hierarchy level |
| `path` | string | Yes | Absolute file path |

## Relationships

```
SystemGuide 1──* GuideSection
GuideSection 1──* Preference
MergedGuide 1──* Preference
MergedGuide 1──* GuidePath
```

## Validation Rules

### Preference ID Format

```regex
^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*)+$
```

**Valid**: `code-style.explicit-types`, `comm.concise`, `workflow.tdd.required`  
**Invalid**: `CodeStyle`, `123-test`, `single`

### Version Format

```regex
^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$
```

**Valid**: `1.0.0`, `2.1.3-beta`  
**Invalid**: `1.0`, `v1.0.0`

### ID Uniqueness

- Within a single guide file, preference IDs MUST be unique
- Across hierarchy levels, same ID means override (lower level wins)

## State Transitions

Preferences don't have complex state machines. The only state is `active`:

```
active: true  ←→  active: false (manual toggle by user)
```

## Storage Format

### File: GUIDE.md

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
```
```

### Parsed JSON (internal representation)

```json
{
  "name": "system-guide",
  "version": "1.0.0",
  "level": "project",
  "verbosity": "brief",
  "filePath": "/Users/dev/project/GUIDE.md",
  "sections": [
    {
      "name": "code-style",
      "heading": "Code Style",
      "preferences": [
        {
          "id": "code-style.explicit-types",
          "type": "hard",
          "content": "Always use explicit TypeScript types; avoid `any`",
          "active": true
        }
      ]
    }
  ]
}
```

## Merge Semantics

```
Global GUIDE.md         Profile GUIDE.md        Project GUIDE.md
     │                       │                       │
     ▼                       ▼                       ▼
┌─────────┐             ┌─────────┐             ┌─────────┐
│ pref-a  │             │ pref-a  │ (override)  │ pref-b  │
│ pref-c  │             │ pref-d  │             │ pref-a  │ (override)
└─────────┘             └─────────┘             └─────────┘
     │                       │                       │
     └───────────────────────┴───────────────────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │  MergedGuide    │
                    │  - pref-a (proj)│ ← project wins
                    │  - pref-b (proj)│
                    │  - pref-c (glob)│
                    │  - pref-d (prof)│
                    └─────────────────┘
```
