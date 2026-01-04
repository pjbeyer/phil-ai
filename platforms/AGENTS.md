# Platform Generators

Plugin generators that transform skill definitions into platform-specific formats.

## Structure

```
platforms/
├── claude-code/
│   └── generator/
│       ├── index.ts      # Entry point, generateAll()
│       ├── transform.ts  # Skill → plugin transformation
│       ├── render.ts     # JSON rendering
│       ├── validate.ts   # Output validation
│       ├── output.ts     # File writing
│       └── marketplace.ts # marketplace.json generation
└── opencode/
    └── generator/
        ├── index.ts      # Entry point, generateAll()
        ├── transform.ts  # Skill → MCP tool transformation
        ├── render.ts     # YAML rendering
        ├── validate.ts   # Output validation
        └── output.ts     # File writing
```

## Output Formats

### Claude Code
Generates to `.claude-plugin/`:
- `marketplace.json` - Plugin registry referencing individual repos

The marketplace.json points to external repositories:
- `https://github.com/pjbeyer/phil-ai-learning.git`
- `https://github.com/pjbeyer/phil-ai-docs.git`
- `https://github.com/pjbeyer/phil-ai-context.git`
- `https://github.com/pjbeyer/phil-ai-workflow.git`

Claude Code fetches plugins directly from these repos. This repo only generates the marketplace index.

### OpenCode
Generates a unified plugin with MCP tools that can install capabilities from the individual repos when selected.

## Generator Pipeline

Both generators follow the same pattern:

1. **Load** - Read skill definitions from `core/skills/`
2. **Transform** - Convert to platform-specific structure
3. **Validate** - Verify output schema compliance
4. **Render** - Format as JSON/YAML
5. **Output** - Write to destination

## Adding a New Platform

1. Create `platforms/{name}/generator/` directory
2. Implement required modules:
   - `transform.ts` - Skill transformation logic
   - `render.ts` - Output formatting
   - `validate.ts` - Schema validation
   - `output.ts` - File writing
   - `index.ts` - Export `generateAll()`
3. Add workspace entry in root `package.json`
4. Add platform installer in `cli/src/commands/install/platforms/`

## Transform Conventions

```typescript
// transform.ts
import type { CoreSkill } from '@phil-ai/shared';

export function transformSkill(skill: CoreSkill): PlatformPlugin {
  return {
    name: `phil-ai-${skill.name}`,
    version: skill.version,
    // Platform-specific fields...
  };
}
```

## Running Generators

```bash
# All platforms
bun run generate

# Specific platform
bunx phil-ai generate --platform=claude-code
bunx phil-ai generate --platform=opencode
```

## Note on Directory Structure

Platforms use `generator/` instead of `src/` to match the conceptual model (these are generators, not libraries). The entry point is `generator/index.ts`.
