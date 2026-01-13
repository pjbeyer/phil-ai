# Issues: 002-scaffold-command Fixes

## [2026-01-13] Issue: marketplace.json Missing Required Fields (#240)

**Problem**: Generated marketplace.json failed validation with 7 missing fields.

**Symptoms**:
```
✗ Validation failed
Errors:
  - description: Required
  - owner: Required
  - plugins.0.version: Required
  - plugins.0.description: Required
  - plugins.0.source: Expected object, received string
  - plugins.0.author: Required
  - plugins.0.license: Required
```

**Root Cause**: Template only included `name` and `source: "./"` - didn't enumerate all required fields.

**Fix**: Updated `MARKETPLACE_TEMPLATE` to include all fields, updated `generateMarketplace()` to extract from manifest.

**Prevention**: When generating files validated by other commands, list ALL required fields in spec/tasks.

---

## [2026-01-13] Issue: Build Script Missing Format Flag (#241)

**Problem**: Running `bun run build` failed with "Missing entrypoints" error.

**Symptoms**:
```
bun build v1.3.5 (1e86cebd)
error: Missing entrypoints. What would you like to bundle?
```

**Root Cause**: Build script missing `--format esm` flag. Script was never executed during development.

**Fix**: Added `--format esm` to build command in `PACKAGE_JSON_TEMPLATE`.

**Prevention**: Include "verify script runs successfully" in acceptance criteria for generated scripts.

---

## [2026-01-13] Issue: Next Steps Wrong Command (#242)

**Problem**: Success message showed `bun build` instead of `bun run build`.

**Symptoms**: Users following instructions would see help text instead of building.

**Root Cause**: Copy-paste error, not validated against generated package.json.

**Fix**: Updated success message to show `bun run build`.

**Prevention**: Validate success messages against actual generated content.

---

## [2026-01-13] Issue: Plugin Path Resolution Failed (#243)

**Problem**: Plugin failed to load commands when run from `.opencode/plugin/`.

**Symptoms**:
```
Error: ENOENT: no such file or directory, open '/path/.opencode/commands'
```

**Root Cause**: Path resolution assumed plugin runs from `dist/`, but local dev loads from `.opencode/plugin/`.

**Technical Details**:
- When loaded from `.opencode/plugin/`: `import.meta.dir` = `.opencode/plugin/`
- `path.join(import.meta.dir, '..', 'commands')` = `.opencode/commands/` ❌
- When loaded from `dist/`: `import.meta.dir` = `dist/`
- `path.join(import.meta.dir, '..', 'commands')` = `commands/` ✓

**Fix**: Added runtime detection:
```typescript
const isLocalPlugin = import.meta.dir.includes('.opencode/plugin');
const commandDir = isLocalPlugin
  ? path.join(import.meta.dir, '..', '..', 'commands')
  : path.join(import.meta.dir, '..', 'commands');
```

**Prevention**: When generating code that runs in multiple contexts, test in ALL contexts before release.

---

## [2026-01-13] Meta-Issue: Testing Gap

**Problem**: All 4 bugs were discovered only after merge, during real-world testing.

**Root Cause**: Original acceptance criteria didn't include end-to-end test with actual plugin.

**Impact**: Required post-merge PR with 4 bug fixes, documentation updates, and additional issues.

**Prevention**: Add end-to-end testing requirement to feature acceptance criteria:
1. Test with real plugin (not just test fixtures)
2. Run all commands mentioned in success message
3. Verify integration with other commands (validate, build, etc.)
4. Test in actual runtime environment (opencode)
