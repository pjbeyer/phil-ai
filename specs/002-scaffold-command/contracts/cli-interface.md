# CLI Interface Contract: scaffold

**Feature**: 002-scaffold-command  
**Date**: 2026-01-11

## Command Signature

```
bunx phil-ai scaffold [options]
```

## Options

| Option | Short | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--path` | `-p` | string | `.` (cwd) | Path to Claude Code plugin directory |
| `--dry-run` | | boolean | `false` | Preview changes without writing files |
| `--force` | `-f` | boolean | `false` | Overwrite existing files without prompting |
| `--help` | `-h` | boolean | | Show help message |

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success - all files generated |
| `1` | Error - validation failed or write error |

## Output Format

### Success Output

```
Phil-AI Scaffold

i Scaffolding OpenCode plugin for: my-plugin

  Validating Claude Code plugin...
✓ Found .claude-plugin/plugin.json
✓ Found 3 commands in commands/
! No skills directory found (optional)

  Generating files...
✓ Created src/index.ts
✓ Created .opencode/plugin/my-plugin.ts
✓ Created package.json
✓ Created tsconfig.json
✓ Created .claude-plugin/marketplace.json
✓ Updated .gitignore

✓ Scaffold complete!

Next steps:
  1. cd /path/to/plugin
  2. bun install
  3. bun build
  4. Test locally with: bunx opencode (plugin auto-loaded from .opencode/plugin/)
  5. Publish to npm: npm publish
```

### Dry Run Output

```
Phil-AI Scaffold (dry run)

i Would scaffold OpenCode plugin for: my-plugin

  Files that would be created:
  + src/index.ts (new)
  + .opencode/plugin/my-plugin.ts (new)
  + package.json (new)
  + tsconfig.json (new)
  + .claude-plugin/marketplace.json (new)
  ~ .gitignore (append)

No files were written.
```

### Overwrite Prompt

```
Phil-AI Scaffold

i Scaffolding OpenCode plugin for: my-plugin

! The following files already exist:
  - package.json
  - tsconfig.json

Overwrite? [y/N] 
```

With `--force`:
```
! Overwriting existing files (--force)
```

### Error Output

```
Phil-AI Scaffold

✗ Not a valid Claude Code plugin: missing .claude-plugin/plugin.json

Expected structure:
  my-plugin/
  ├── .claude-plugin/
  │   └── plugin.json    <- Required
  └── commands/          <- Optional but recommended
```

```
Phil-AI Scaffold

✗ Invalid plugin.json: missing required fields

Errors:
  - name: Plugin name is required
  - version: Invalid version format (expected: x.y.z)
```

```
Phil-AI Scaffold

✗ Path does not exist: /path/to/nonexistent
```

## Validation Contract

### Input Validation (in order)

1. **Path exists**: Directory at `--path` must exist
2. **Plugin manifest exists**: `.claude-plugin/plugin.json` must exist
3. **Manifest is valid JSON**: Must parse without errors
4. **Required fields present**: `name`, `version`, `description` required
5. **Version format valid**: Must match semver pattern

### Warnings (non-blocking)

- `commands/` directory missing → warn, continue
- `skills/` directory missing → silent, continue
- Existing files will be overwritten → prompt (unless `--force`)

## Generated File Contracts

### src/index.ts

- **Location**: `{pluginRoot}/src/index.ts`
- **Content**: OpenCode plugin with command loader
- **Dependencies**: `@opencode-ai/plugin`, `path`, `bun:glob`
- **Exports**: Named export matching plugin name (PascalCase)

### .opencode/plugin/{name}.ts

- **Location**: `{pluginRoot}/.opencode/plugin/{pluginName}.ts`
- **Content**: Exact copy of `src/index.ts`
- **Purpose**: Local development/testing without npm publish

### package.json

- **Location**: `{pluginRoot}/package.json`
- **Content**: npm package manifest
- **Fields from manifest**: `name`, `version`, `description`, `author`, `repository`, `license`
- **Fixed fields**: `type: "module"`, exports configuration, build scripts

### tsconfig.json

- **Location**: `{pluginRoot}/tsconfig.json`
- **Content**: TypeScript configuration for Bun build
- **Target**: ES2022, ESNext modules, bundler resolution

### .claude-plugin/marketplace.json

- **Location**: `{pluginRoot}/.claude-plugin/marketplace.json`
- **Content**: Dev marketplace for local Claude Code testing
- **Name**: `{pluginName}-dev`

### .gitignore (update)

- **Location**: `{pluginRoot}/.gitignore`
- **Action**: Append if not present
- **Content added**: `dist/`, `node_modules/`

## Integration Points

### CLI Router (cli/src/index.ts)

```typescript
case "scaffold":
  const { runScaffold } = await import("./commands/scaffold/index.js");
  await runScaffold(args);
  break;
```

### Help Text

```
scaffold     Add OpenCode scaffolding to a Claude Code plugin

Options:
  --path, -p     Target plugin directory (default: current directory)
  --dry-run      Preview changes without writing
  --force, -f    Overwrite existing files without prompting

Examples:
  bunx phil-ai scaffold
  bunx phil-ai scaffold --path=../my-plugin
  bunx phil-ai scaffold --dry-run
  bunx phil-ai scaffold --force
```
