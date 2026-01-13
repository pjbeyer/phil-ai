# Learnings: 002-scaffold-command Fixes

## [2026-01-13] Task: Fix scaffold command bugs discovered in real-world testing

### Template-Generated Files Must Pass Validation

**Discovery**: Generated `marketplace.json` was missing 7 required fields, causing `bunx phil-ai validate` to fail.

**Root Cause**: Template was simplified to only include `name` and `source: "./"`, but validate command expects full schema with:
- `description` (marketplace level)
- `owner` object (name, email, url)
- `version` (plugin level)
- `source` as object with `source: "url"` and `url` fields
- `author` object (name, email)
- `license` field

**Pattern**: When generating files that will be validated by other commands, enumerate ALL required fields explicitly in templates. Don't assume "follow pattern X" - list every field.

**Application**: Updated `MARKETPLACE_TEMPLATE` and `generateMarketplace()` to include all fields from plugin manifest.

---

## [2026-01-13] Task: Fix build script

### Generated Scripts Must Be Executable End-to-End

**Discovery**: Build script `bun build ./src/index.ts --outdir dist --target bun` failed with "Missing entrypoints" error.

**Root Cause**: Missing `--format esm` flag. Script was never actually executed during development - only syntax-validated.

**Pattern**: Generated scripts (build, test, etc.) must be tested by running them, not just checking syntax. Include script execution in acceptance criteria.

**Application**: Added `--format esm` to build command in `PACKAGE_JSON_TEMPLATE`.

---

## [2026-01-13] Task: Fix success message

### Success Messages Must Match Generated Content

**Discovery**: Success message showed `bun build` (direct command) instead of `bun run build` (npm script).

**Root Cause**: Copy-paste error. Message wasn't validated against generated package.json.

**Pattern**: Success messages referencing generated files should be validated against actual content. Consider extracting script names from template constants rather than hardcoding.

**Application**: Updated success message in `cli/src/commands/scaffold/index.ts` to show `bun run build`.

---

## [2026-01-13] Task: Fix plugin path resolution

### Plugins Need Context-Aware Path Resolution

**Discovery**: Plugin failed to load commands when run from `.opencode/plugin/` with error: `ENOENT: no such file or directory, open '/path/.opencode/commands'`

**Root Cause**: Plugin code used `path.join(import.meta.dir, '..', 'commands')` which works from `dist/` (npm) but fails from `.opencode/plugin/` (local dev).

**Pattern**: When generating code that runs in multiple contexts (local dev vs npm package), detect runtime context and adjust paths accordingly.

**Application**: Added runtime detection:
```typescript
const isLocalPlugin = import.meta.dir.includes('.opencode/plugin');
const commandDir = isLocalPlugin
  ? path.join(import.meta.dir, '..', '..', 'commands')  // local
  : path.join(import.meta.dir, '..', 'commands');        // npm
```

---

## [2026-01-13] Meta-Learning: End-to-End Testing

### Real-World Testing Catches Integration Issues

**Discovery**: All 4 bugs were discovered only when testing with actual plugin (phil-ai-learning) after initial PR was merged.

**Root Cause**: Original acceptance criteria didn't include end-to-end test with real plugin. Unit tests passed but integration failed.

**Pattern**: Before marking feature complete, test with real-world data:
1. Run scaffold on actual plugin (e.g., phil-ai-learning)
2. Run validate command on generated files
3. Run build command
4. Run the actual application (opencode)
5. Verify all commands in success message work

**Application**: Updated spec.md, plan.md, and tasks.md with post-implementation lessons emphasizing end-to-end testing.

---

## [2026-01-13] Convention: Scaffold Command Structure

**Pattern Discovered**: Separation of concerns in scaffold command:
```
cli/src/commands/scaffold/
├── index.ts       # Entry point (runScaffold)
├── schemas.ts     # Zod validation
├── validate.ts    # Plugin directory validation
├── extract.ts     # Parse plugin.json, scan commands/skills
├── generate.ts    # Generate file content
├── templates.ts   # Template constants
├── render.ts      # Template variable substitution
├── utils.ts       # Helpers (toPascalCase)
└── output.ts      # File writing with overwrite prompts
```

**Benefit**: Each module has single responsibility, making testing and debugging easier.

**Application**: Follow this pattern for future CLI commands that generate files.
