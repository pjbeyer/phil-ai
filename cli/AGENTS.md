# CLI Package (@phil-ai/cli)

Installation and management CLI for phil-ai ecosystem.

## Command Structure

```
cli/src/
├── commands/
│   ├── generate/     # Generate platform plugins
│   ├── install/      # First-time installation
│   │   ├── platforms/  # Platform-specific installers
│   │   ├── config.ts   # Config file creation
│   │   ├── directories.ts # Directory setup
│   │   └── prerequisites.ts # Dependency checks
│   ├── status/       # Health checks and suggestions
│   │   ├── checks/   # Individual check implementations
│   │   └── suggestions.ts # Auto-fix suggestions
│   ├── sync/         # Sync local changes upstream
│   └── update/       # Update with backup/migration
├── lib/
│   ├── args.ts       # Argument parsing utilities
│   ├── errors.ts     # Error handling
│   ├── health.ts     # Health check framework
│   └── output.ts     # Formatted console output
└── index.ts          # Entry point with routing
```

## Commands

| Command | Description | Key Files |
|---------|-------------|-----------|
| `install` | First-time setup with platform detection | `install/index.ts`, `install/platforms/*.ts` |
| `status` | Health checks with fix suggestions | `status/index.ts`, `status/checks/*.ts` |
| `update` | Update with automatic backup | `update/index.ts`, `update/backup.ts` |
| `sync` | Sync customizations upstream | `sync/index.ts` |
| `generate` | Generate platform-specific plugins | `generate/index.ts` |

## Adding a New Command

1. Create `commands/{name}/index.ts` with default export function
2. Add route in `index.ts` switch statement
3. Use `lib/output.ts` for consistent formatting
4. Use `lib/errors.ts` for error handling

## Adding a Platform

1. Create `commands/install/platforms/{name}.ts`
2. Export `install{Name}()` function
3. Import and add to platform map in `install/index.ts`

## Dependencies

- Uses `@phil-ai/shared` for schemas and storage
- Imports generators via relative paths from `platforms/`

## Output Conventions

```typescript
import { log, success, error, info } from '../lib/output';

log('Regular message');
success('Operation completed');
error('Something failed');
info('Additional context');
```
