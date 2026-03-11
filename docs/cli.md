# Phil-AI CLI Usage Documentation

Phil-AI provides a command-line interface for managing the cross-platform AI plugin system.

**Invocation**: `bunx phil-ai <command> [options]`

## Command Summary

| Command | Purpose |
|---------|---------|
| `install` | Install or update phil-ai system components |
| `status` | Check system health and component versions |
| `generate` | Generate platform-specific plugin indices |
| `validate` | Validate marketplace or plugin structures |

## Global Options

| Flag | Type | Description |
|------|------|-------------|
| `--help`, `-h` | boolean | Show help message |
| `--version`, `-v` | boolean | Show version number |
| `--config` | string | Path to config file (default: `~/.config/phil-ai/config.yaml`) |
| `--quiet`, `-q` | boolean | Suppress non-error output |
| `--debug` | boolean | Enable debug logging |

---

## install

Install or update phil-ai system components, including core, CLI, and MCP.

### Syntax
```bash
bunx phil-ai install [options]
```

### Options
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--platforms` | string[] | all | Platforms to install: `claude-code`, `opencode`, `all` |
| `--force` | boolean | false | Reinstall even if current version is installed |
| `--dry-run` | boolean | false | Show what would be installed without performing changes |

### Exit Codes
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | General error |
| 2 | Prerequisites not met (e.g., Bun version) |
| 3 | Partial installation |

### Example
```bash
bunx phil-ai install --platforms=claude-code
```

---

## status

Check system health, component versions, and storage accessibility.

### Syntax
```bash
bunx phil-ai status [options]
```

### Options
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--json` | boolean | false | Output status as JSON |
| `--verbose` | boolean | false | Include detailed diagnostics and storage info |

### Exit Codes
| Code | Meaning |
|------|---------|
| 0 | All systems healthy |
| 1 | One or more components unhealthy |
| 2 | System not installed |

### Example
```bash
bunx phil-ai status --verbose
```

---



## generate

Generate `marketplace.json` index pointing to external plugin repositories.

### Syntax
```bash
bunx phil-ai generate [options]
```

### Options
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--output` | string | `.claude-plugin/` | Output directory for the index |
| `--validate` | boolean | true | Validate marketplace.json schema after generation |

### Exit Codes
| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Generation failed |
| 2 | Validation failed |

---

## validate

Validate the structure and schemas of marketplace indices or individual plugins.

### Syntax
```bash
bunx phil-ai validate [target] [options]
```

### Options
| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--type` | string | auto | Validation type: `marketplace`, `plugin`, `auto` |

### Exit Codes
| Code | Meaning |
|------|---------|
| 0 | Valid |
| 1 | Invalid |

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PHIL_AI_CONFIG` | Custom path to config file |
| `PHIL_AI_DATA` | Custom path to data directory |
| `PHIL_AI_LOG_LEVEL` | Log level (`debug`, `info`, `warn`, `error`) |
| `NO_COLOR` | Disable colored terminal output |
