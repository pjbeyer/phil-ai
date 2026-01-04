# Quickstart: Phil-AI Multi-Platform System

Get phil-ai running on Claude Code and OpenCode in under 5 minutes.

## Prerequisites

- **Bun** 1.0+ installed ([bun.sh](https://bun.sh))
- **Claude Code** and/or **OpenCode** installed
- macOS or Linux (Windows WSL supported)

Verify Bun:
```bash
bun --version
# Should output: 1.x.x
```

## Installation

### One-Line Install

```bash
bunx phil-ai install
```

This will:
1. Create data directory at `~/.local/share/phil-ai/`
2. Create config directory at `~/.config/phil-ai/`
3. Install core components
4. Generate and register platform plugins
5. Run health check

### Verify Installation

```bash
bunx phil-ai status
```

Expected output:
```
phil-ai system status

Components:
  core         v1.0.0  healthy
  cli          v1.0.0  healthy
  mcp          v1.0.0  healthy

Platforms:
  claude-code  connected   4 plugins active
  opencode     connected   plugin loaded
```

## Platform-Specific Setup

### Claude Code

Plugins are automatically registered with the phil-ai marketplace:

```bash
# In Claude Code
/plugin marketplace list
# Should show: phil-ai (4 plugins)

/plugin install phil-ai-learning@phil-ai
/plugin install phil-ai-docs@phil-ai
/plugin install phil-ai-context@phil-ai
/plugin install phil-ai-workflow@phil-ai
```

### OpenCode

The plugin is automatically configured. Verify:

```bash
# Check opencode.json
cat ~/.config/opencode/opencode.json | grep phil-ai
```

Should show phil-ai in the plugins array.

## First Use

### Capture a Learning

**Claude Code:**
```bash
/learn
```

**OpenCode:**
The `capture-learning` tool is available via MCP.

### Check Learnings

```bash
bunx phil-ai status --verbose
# Shows learning count and recent activity
```

## Directory Structure

After installation:

```
~/.local/share/phil-ai/     # Private data
├── learnings/              # Your learnings by level
├── patterns/               # Extracted patterns
├── index.json              # Quick lookup index
└── version.json            # Version tracking

~/.config/phil-ai/          # Configuration
├── config.yaml             # Main config
└── profiles/               # Profile overrides
```

## Common Commands

| Command | Description |
|---------|-------------|
| `bunx phil-ai install` | Install/update system |
| `bunx phil-ai status` | Check health |
| `bunx phil-ai update` | Update to latest |
| `bunx phil-ai sync` | Sync across platforms |
| `bunx phil-ai generate` | Regenerate plugins |

## Troubleshooting

### "Command not found: bunx"

Install Bun:
```bash
curl -fsSL https://bun.sh/install | bash
```

### "MCP server port in use"

Change port in config:
```bash
# Edit ~/.config/phil-ai/config.yaml
mcp:
  port: 3001
```

### "Plugin not found" in OpenCode

Reinstall OpenCode plugin:
```bash
bunx phil-ai install --platforms opencode --force
```

### "Permission denied" errors

Check directory permissions:
```bash
ls -la ~/.local/share/phil-ai/
ls -la ~/.config/phil-ai/
```

Fix if needed:
```bash
chmod 755 ~/.local/share/phil-ai/
chmod 755 ~/.config/phil-ai/
```

## Next Steps

1. **Customize config**: Edit `~/.config/phil-ai/config.yaml`
2. **Set up profiles**: Add your project profiles
3. **Start learning**: Use `/learn` to capture insights
4. **Extract patterns**: Use `/implement-learnings` to close the loop

## Getting Help

```bash
bunx phil-ai --help
bunx phil-ai <command> --help
```

Documentation: https://github.com/pjbeyer/phil-ai
