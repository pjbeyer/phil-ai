# phil-ai Development Guidelines

Bun-powered TypeScript monorepo for multi-platform AI plugin generation.

## Architecture Overview

```
phil-ai/
├── cli/                    # @phil-ai/cli - Installation & management CLI
├── shared/                 # @phil-ai/shared - Schemas, storage, versioning
├── mcp/                    # @phil-ai/mcp - Model Context Protocol server
├── platforms/
│   ├── claude-code/        # @phil-ai/platform-claude-code generator
│   └── opencode/           # @phil-ai/platform-opencode generator
├── core/skills/            # Skill definitions (learning, docs, context, workflow)
├── tests/                  # Centralized test suite
└── specs/                  # Feature specifications
```

## Workspace Packages

| Package | Path | Purpose |
|---------|------|---------|
| `@phil-ai/cli` | `cli/` | CLI commands: install, status, update, sync, generate, validate, scaffold, guide |
| `@phil-ai/shared` | `shared/` | Zod schemas, file-locked storage, semver utilities |
| `@phil-ai/mcp` | `mcp/` | MCP server with stdio transport |
| `@phil-ai/platform-claude-code` | `platforms/claude-code/` | Plugin generator for Claude Code |
| `@phil-ai/platform-opencode` | `platforms/opencode/` | Plugin generator for OpenCode |

## Commands

```bash
bun install          # Install dependencies (exact versions enforced)
bun test             # Run tests with coverage
bun run lint         # Biome linting
bun run build        # Build all packages
bun run generate     # Generate platform plugins to .claude-plugin/
```

## Technology Stack

- **Runtime**: Bun 1.x (required >=1.0.0)
- **Language**: TypeScript 5.x (ES2022 target, strict mode)
- **Validation**: Zod schemas for all data structures
- **Testing**: Bun test runner with coverage
- **Linting**: Biome (default config)

## Code Conventions

### TypeScript Rules
- Strict mode enabled (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Use `@phil-ai/*` path aliases for workspace imports
- No `as any`, `@ts-ignore`, or empty catch blocks
- Explicit imports from `bun:test` in test files

### File Organization
- Source in `src/` directories (except `platforms/*/generator/`)
- Tests in centralized `tests/` directory, mirroring source structure
- Use `TEST_DIR` and `getTestPath()` from `tests/setup.ts` for filesystem tests

### Patterns
- Zod schemas define all data contracts
- File-locked JSON/YAML storage for concurrent safety
- Semver utilities for version compatibility checks

## Entry Points

| Binary | Entry | Purpose |
|--------|-------|---------|
| `phil-ai` | `cli/src/index.ts` | Main CLI |
| `phil-ai-mcp` | `mcp/src/server.ts` | MCP server (stdio) |

## Skill Definitions

Skills in `core/skills/` follow this structure:
```
{skill}/
├── skill.json    # Metadata (name, version, type, commands, tools)
└── SKILL.md      # Detailed instructions
```

Available skills: `learning`, `docs`, `context`, `workflow`, `guide`

## Generator Output

- **Claude Code**: `.claude-plugin/` with 5 plugins + `marketplace.json`
- **OpenCode**: Unified plugin with 9 MCP tools (includes guide tools)

## Testing

```bash
bun test                    # Run all tests
bun test tests/unit/schemas # Run specific directory
bun test --coverage         # With coverage report
```

Tests use:
- `beforeEach`/`afterEach` for temp directory management
- `Bun.file().json()` for file assertions
- Zod `.parse()` / `.safeParse()` for schema validation

## Recent Changes
- 001-multiplatform-scaffolding: Complete implementation with CLI (6 commands), MCP server (8 tools), shared schemas, and platform generators
- 002-scaffold-command: Add scaffold CLI command with --path, --dry-run, --force flags to generate OpenCode plugin scaffolding for Claude Code plugins
- 003-system-guide: Hierarchical user preference system with GUIDE.md files, CLI commands (guide init/show/validate), and MCP tools (get_guide, list_preferences, check_preference)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

## Active Technologies
- Human-readable files (JSON/YAML) at `~/.local/share/phil-ai/`, config at `~/.config/phil-ai/` (001-multiplatform-scaffolding)
- gray-matter for YAML frontmatter parsing (003-system-guide)
- GUIDE.md files for user preferences at hierarchy levels (003-system-guide)
