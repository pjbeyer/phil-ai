# Quickstart: Scaffold Command Development

**Feature**: 002-scaffold-command  
**Date**: 2026-01-11

## Prerequisites

- Bun 1.x installed
- phil-ai monorepo cloned
- Working on `feat/002-scaffold-command` branch (or worktree)

## Development Setup

```bash
# Navigate to worktree
cd /Users/pjbeyer/Projects/pjbeyer/phil-ai/.worktrees/002-scaffold-command

# Install dependencies
bun install

# Verify existing tests pass
bun test
```

## Implementation Order

### Phase 1: Core Validation

```bash
# Create command directory
mkdir -p cli/src/commands/scaffold

# Implement in this order:
# 1. validate.ts - Plugin detection and validation
# 2. extract.ts - Metadata extraction from plugin.json
```

**Test First**:
```bash
# Run existing validate command tests for patterns
bun test tests/unit/commands/validate
```

### Phase 2: Templates & Rendering

```bash
# 3. templates.ts - Template strings from constitution
# 4. render.ts - Template variable substitution
```

**Verify templates match constitution** (lines 206-366):
```bash
# Compare generated output with constitution templates
cat .specify/memory/constitution.md | sed -n '206,366p'
```

### Phase 3: File Output

```bash
# 5. output.ts - File writing with overwrite handling
# 6. index.ts - Command entry point, CLI integration
```

### Phase 4: CLI Integration

```typescript
// Add to cli/src/index.ts
case "scaffold":
  const { runScaffold } = await import("./commands/scaffold/index.js");
  await runScaffold(args);
  break;
```

## Testing Strategy

### Unit Tests

```bash
# Create test files
mkdir -p tests/unit/scaffold

# Tests to create:
# - validate.test.ts: Plugin detection, error cases
# - extract.test.ts: Metadata parsing
# - render.test.ts: Template substitution
# - templates.test.ts: Template correctness
```

### Integration Tests

```bash
mkdir -p tests/integration/scaffold

# Test with real plugin structure:
# 1. Create temp directory
# 2. Create minimal .claude-plugin/plugin.json
# 3. Run scaffold command
# 4. Verify all files generated correctly
# 5. Verify generated plugin builds
```

### Manual Testing

```bash
# Test with superpowers-developing-for-claude-code
cd ~/Projects/pjbeyer/superpowers-developing-for-claude-code
bunx phil-ai scaffold --dry-run

# Verify output looks correct, then:
bunx phil-ai scaffold

# Test the generated plugin builds:
bun install
bun build
```

## Key Files to Reference

| File | Purpose |
|------|---------|
| `cli/src/commands/validate/index.ts` | Pattern for validation commands |
| `cli/src/commands/generate/index.ts` | Pattern for --dry-run, --force flags |
| `cli/src/lib/args.ts` | Flag parsing utilities |
| `cli/src/lib/output.ts` | Console output formatting |
| `.specify/memory/constitution.md` | Template source (lines 206-366) |
| `superpowers/.opencode/plugin/superpowers.js` | Reference OpenCode plugin |

## Common Issues

### Template Escaping

Constitution templates contain `{{placeholders}}`. The render function must:
```typescript
// render.ts
export function render(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  return result;
}
```

### Plugin Name Formatting

```typescript
// Convert "my-plugin" to "MyPlugin" for export name
function toPascalCase(name: string): string {
  return name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}
```

### File Existence Checks

```typescript
// Use Bun.file for existence checks
const file = Bun.file(path);
if (await file.exists()) {
  // File exists, handle overwrite
}
```

### Glob for Commands

```typescript
// Use Bun.Glob for command discovery
const glob = new Bun.Glob('**/*.md');
for await (const file of glob.scan({ cwd: commandDir, absolute: true })) {
  // Process command file
}
```

## Verification Checklist

Before marking implementation complete:

- [ ] `bunx phil-ai scaffold --help` shows correct usage
- [ ] `bunx phil-ai scaffold` works in valid plugin directory
- [ ] `bunx phil-ai scaffold --dry-run` shows preview without writing
- [ ] `bunx phil-ai scaffold --force` overwrites without prompting
- [ ] `bunx phil-ai scaffold --path=/other/dir` works
- [ ] Error messages are actionable (no stack traces)
- [ ] Generated plugin builds: `bun build`
- [ ] Generated plugin works: `bunx opencode` loads it
- [ ] All tests pass: `bun test`
- [ ] Lint passes: `bun run lint`

## Next Steps After Implementation

1. **Test with real plugins**:
   - `superpowers-developing-for-claude-code`
   - `superpowers` (if applicable)
   
2. **Update CLI AGENTS.md** to document new command

3. **Update README.md** with scaffold usage

4. **Create PR** with all changes
