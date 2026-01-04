# Shared Package (@phil-ai/shared)

Core utilities shared across all phil-ai packages.

## Module Structure

```
shared/src/
├── schemas/          # Zod validation schemas
│   ├── base.ts       # VersionedData, SemverRegex
│   ├── config.ts     # Config, Priority, ImpactLevel, EffortLevel
│   ├── plugin.ts     # PlatformPlugin, Platform types
│   ├── skill.ts      # CoreSkill, SkillCategory
│   ├── state.ts      # Learning, Pattern, StateIndex
│   └── version.ts    # ComponentVersion, VersionManifest
├── storage/          # File operations with locking
│   ├── directories.ts # Path resolution and directory management
│   ├── json.ts       # JSON read/write with file locking
│   ├── yaml.ts       # YAML read/write with file locking
│   └── lock.ts       # File locking primitives
├── version/          # Semver utilities
│   ├── semver.ts     # Parse, compare, increment versions
│   ├── compatibility.ts # Migration checks
│   └── manifest.ts   # Version manifest handling
└── index.ts          # Public API exports
```

## Schemas

### Core Types

```typescript
// Base versioned data wrapper
type VersionedData<T> = {
  version: string;
  data: T;
  updatedAt: string;
}

// Skill definition
type CoreSkill = {
  name: string;
  version: string;
  description: string;
  category: 'learning' | 'docs' | 'context' | 'workflow';
  tags: string[];
  allowedTools: string[];
  permissions: string[];
  entryPoint: string;
}

// Platform plugin
type PlatformPlugin = {
  name: string;
  version: string;
  platform: 'claude-code' | 'opencode';
  skills: string[];
}

// Config
type Config = {
  version: string;
  skills: { enabled: string[], disabled: string[] };
  platforms: Record<string, object>;
}
```

## Storage API

### File-Locked Operations

```typescript
import { readJson, writeJson, readYaml, writeYaml } from '@phil-ai/shared';

// JSON (with file locking)
const data = await readJson<Config>(path);
await writeJson(path, data);

// YAML (with file locking)  
const yaml = await readYaml<Config>(path);
await writeYaml(path, yaml);

// Unsafe variants (no locking, for read-only scenarios)
const data = await readJsonUnsafe<Config>(path);
```

### Directory Management

```typescript
import { 
  getDataDir,      // ~/.local/share/phil-ai (Linux) or platform equivalent
  getConfigDir,    // ~/.config/phil-ai (Linux) or platform equivalent
  getLockDir,      // Temp directory for locks
  ensureAllDirs,   // Create all required directories
  isWritable,      // Check if path is writable
  dirExists,       // Check if directory exists
} from '@phil-ai/shared';

// Platform-aware paths
const dataDir = getDataDir();   // XDG-compliant on Linux
const configDir = getConfigDir();

// Ensure directories exist
await ensureAllDirs();
```

## Version Utilities

```typescript
import { 
  parseSemver,       // Parse "1.2.3" → { major: 1, minor: 2, patch: 3 }
  formatSemver,      // Format back to string
  compareSemver,     // Compare two versions (-1, 0, 1)
  isCompatible,      // Check major version compatibility
  isNewerThan,       // Version comparison
  incrementVersion,  // Bump major/minor/patch
} from '@phil-ai/shared';

parseSemver('1.2.3');              // { major: 1, minor: 2, patch: 3, prerelease: undefined }
compareSemver('1.2.3', '1.2.4');   // -1
isCompatible('1.2.3', '1.0.0');    // true (same major)
incrementVersion('1.2.3', 'patch'); // '1.2.4'
```

### Migration Support

```typescript
import { checkCompatibility, needsMigration, getMigrationPath } from '@phil-ai/shared';

const result = checkCompatibility('0.1.0', '1.0.0');
if (!result.compatible) {
  const path = getMigrationPath('0.1.0', '1.0.0');
  // path = ['0.1.0', '0.2.0', '1.0.0'] or similar
}
```

## Adding New Schemas

1. Create schema file in `schemas/` using Zod
2. Export schema, types, and factory functions
3. Add to `schemas/index.ts`
4. Add tests in `tests/unit/schemas/`

### Schema Conventions

```typescript
// schemas/example.ts
import { z } from 'zod';

// 1. Define Zod schema
export const ExampleSchema = z.object({
  id: z.string(),
  name: z.string(),
  createdAt: z.string().datetime(),
});

// 2. Export inferred type
export type Example = z.infer<typeof ExampleSchema>;

// 3. Export factory function (optional)
export function createExample(name: string): Example {
  return { id: crypto.randomUUID(), name, createdAt: new Date().toISOString() };
}
```

## Testing

```typescript
import { describe, expect, test } from 'bun:test';
import { ExampleSchema, createExample } from '@phil-ai/shared';

test('validates correct data', () => {
  const result = ExampleSchema.safeParse(createExample('test'));
  expect(result.success).toBe(true);
});

test('rejects invalid data', () => {
  const result = ExampleSchema.safeParse({ invalid: true });
  expect(result.success).toBe(false);
});
```
