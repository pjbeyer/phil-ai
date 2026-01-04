# CLI Contract: phil-ai

**Version**: 1.0.0  
**Invocation**: `bunx phil-ai <command> [options]`

> **Architecture Note (Constitution v2.0.1)**: External plugin repos are the source of truth. This CLI provides infrastructure management. The `generate` command produces a marketplace index (not full plugins). The `scaffold` command (feature 002) adds OpenCode support to external repos.

## Commands

### `install`

Install or update phil-ai system components.

```bash
bunx phil-ai install [options]
```

**Options**:
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--platforms` | string[] | all | Platforms to install: `claude-code`, `opencode`, `all` |
| `--force` | boolean | false | Reinstall even if current version installed |
| `--dry-run` | boolean | false | Show what would be installed without installing |

**Behavior**:
1. Check prerequisites (Bun version, disk space)
2. Create directories if needed (`~/.local/share/phil-ai/`, `~/.config/phil-ai/`)
3. Install/update core components
4. Generate platform plugins
5. Register with platforms (marketplace for Claude Code, config for OpenCode)
6. Run health check
7. Report success/failure

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Prerequisites not met |
| 3 | Partial installation (some components failed) |

**Output** (success):
```
phil-ai v1.0.0 installation complete

Components installed:
  core         v1.0.0  ✓
  cli          v1.0.0  ✓
  mcp          v1.0.0  ✓

Platforms configured:
  claude-code  ✓  4 plugins registered
  opencode     ✓  plugin installed

Storage:
  data    ~/.local/share/phil-ai/
  config  ~/.config/phil-ai/

Run 'bunx phil-ai status' to verify health
```

---

### `status`

Check system health and component versions.

```bash
bunx phil-ai status [options]
```

**Options**:
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--json` | boolean | false | Output as JSON |
| `--verbose` | boolean | false | Include detailed diagnostics |

**Behavior**:
1. Load version manifest
2. Check each component health
3. Verify platform configurations
4. Check storage accessibility
5. Report status

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | All healthy |
| 1 | One or more components unhealthy |
| 2 | System not installed |

**Output** (healthy):
```
phil-ai system status

Components:
  core         v1.0.0  healthy
  cli          v1.0.0  healthy
  mcp          v1.0.0  healthy

Platforms:
  claude-code  connected   4 plugins active
  opencode     connected   plugin loaded

Storage:
  data    ~/.local/share/phil-ai/  writable  12 learnings
  config  ~/.config/phil-ai/       writable

Last sync: 2026-01-02T12:00:00Z
```

**Output** (unhealthy):
```
phil-ai system status

Components:
  core         v1.0.0  healthy
  cli          v1.0.0  healthy
  mcp          v1.0.0  ERROR: port 3000 in use

Platforms:
  claude-code  connected   4 plugins active
  opencode     ERROR: plugin not found

Suggested fixes:
  - MCP: Change port in ~/.config/phil-ai/config.yaml or stop conflicting service
  - OpenCode: Run 'bunx phil-ai install --platforms opencode'
```

---

### `update`

Update to latest versions.

```bash
bunx phil-ai update [options]
```

**Options**:
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--check` | boolean | false | Check for updates without installing |
| `--force` | boolean | false | Update even if current version is latest |

**Behavior**:
1. Check for available updates
2. Backup current state
3. Download and install updates
4. Run migrations if needed
5. Regenerate platform plugins
6. Verify health

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | Success (or no updates available) |
| 1 | Update failed |
| 2 | Migration failed (rolled back) |

---

### `sync`

Synchronize state across platforms.

```bash
bunx phil-ai sync [options]
```

**Options**:
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--direction` | string | both | Sync direction: `push`, `pull`, `both` |
| `--dry-run` | boolean | false | Show what would sync |

**Behavior**:
1. Lock state files
2. Read state from all sources
3. Merge changes (last-write-wins for conflicts)
4. Write merged state
5. Update platform caches
6. Release locks

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Sync failed |
| 2 | Lock timeout (another process has lock) |

---

### `generate`

Generate marketplace index pointing to external plugin repos.

```bash
bunx phil-ai generate [options]
```

**Options**:
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--output` | string | `.claude-plugin/` | Output directory for marketplace.json |
| `--validate` | boolean | true | Validate marketplace.json schema |

**Behavior**:
1. Read external plugin repo metadata (from config or remote)
2. Validate each plugin's repository and version
3. Generate marketplace.json index
4. Validate output schema
5. Write to output directory

**Output**:
- `.claude-plugin/marketplace.json` - Index pointing to external plugin repos

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Generation failed |
| 2 | Validation failed |

**Example Output**:
```
phil-ai generate

Generating marketplace index...

Plugins indexed:
  phil-ai-learning   v1.1.1  ✓  github.com/pjbeyer/phil-ai-learning
  phil-ai-docs       v1.0.0  ✓  github.com/pjbeyer/phil-ai-docs
  phil-ai-context    v1.0.0  ✓  github.com/pjbeyer/phil-ai-context
  phil-ai-workflow   v1.0.0  ✓  github.com/pjbeyer/phil-ai-workflow

Output: .claude-plugin/marketplace.json
```

---

### `scaffold` (Feature 002)

Add OpenCode support to external plugin repositories. See `specs/002-scaffold-command/` for full specification.

```bash
bunx phil-ai scaffold <repo-path> [options]
```

**Options**:
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--dry-run` | boolean | false | Show what would be generated |
| `--force` | boolean | false | Overwrite existing opencode/ directory |

**Behavior**:
1. Analyze existing Claude Code plugin structure (skills/, commands/)
2. Generate OpenCode plugin entry point and tools
3. Create `opencode/` directory in external repo
4. Validate generated TypeScript

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Scaffolding failed |
| 2 | Validation failed |

---

### `validate`

Validate marketplace.json or plugin structure.

```bash
bunx phil-ai validate [target] [options]
```

**Options**:
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--type` | string | auto | Validation type: `marketplace`, `plugin`, `auto` |

**Behavior**:
1. Detect target type (marketplace.json or plugin directory)
2. Run appropriate schema validation
3. Check external repo accessibility (for marketplace)
4. Report validation results

**Exit Codes**:
| Code | Meaning |
|------|---------|
| 0 | Valid |
| 1 | Invalid |

---

## Global Options

| Flag | Type | Description |
|------|------|-------------|
| `--help`, `-h` | boolean | Show help |
| `--version`, `-v` | boolean | Show version |
| `--config` | string | Path to config file (default: `~/.config/phil-ai/config.yaml`) |
| `--quiet`, `-q` | boolean | Suppress non-error output |
| `--debug` | boolean | Enable debug logging |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PHIL_AI_CONFIG` | Config file path | `~/.config/phil-ai/config.yaml` |
| `PHIL_AI_DATA` | Data directory | `~/.local/share/phil-ai/` |
| `PHIL_AI_LOG_LEVEL` | Log level | `info` |
| `NO_COLOR` | Disable colored output | unset |

---

## Error Messages

All errors follow format:
```
Error: <brief description>

<details if available>

Suggested fix: <actionable guidance>
```

Example:
```
Error: MCP server port 3000 already in use

Another process is using port 3000. This prevents the MCP server from starting.

Suggested fix:
  1. Stop the conflicting service, OR
  2. Change MCP port: bunx phil-ai config set mcp.port 3001
```

---

## Command Summary

| Command | Purpose | Output |
|---------|---------|--------|
| `install` | Install phil-ai system | Directories, config, platform registration |
| `status` | Check system health | Component and platform status |
| `update` | Update to latest versions | Updated components |
| `sync` | Synchronize state | Merged state across platforms |
| `generate` | Generate marketplace index | `.claude-plugin/marketplace.json` |
| `scaffold` | Add OpenCode to external repo | `opencode/` directory in target repo |
| `validate` | Validate marketplace or plugin | Validation report |

---

## Usage Examples

```bash
# First-time installation
bunx phil-ai install

# Check system health
bunx phil-ai status

# Generate marketplace index
bunx phil-ai generate

# Add OpenCode support to external plugin repo
bunx phil-ai scaffold ~/Projects/pjbeyer/phil-ai-learning

# Validate marketplace
bunx phil-ai validate .claude-plugin/marketplace.json
```
