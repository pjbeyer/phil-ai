# phil-ai

Cross-platform AI plugin system for hierarchical agent workflows, documentation management, and continuous learning.

## Overview

phil-ai provides plugins for multiple AI coding assistants:

- **Claude Code**: Individual plugins via marketplace (separate repos for compatibility)
- **OpenCode**: Unified plugin generated from this monorepo

## Plugins

### phil-ai-learning

Capture and implement learnings with hierarchical storage and closed-loop tracking.

**Features**:
- Hierarchical storage (global/profile/project/agent)
- Closed-loop tracking with documentation-first approach
- Cross-profile pattern extraction
- Robust search across all profiles

**Commands**:
- `/learn` - Capture a learning
- `/implement-learnings` - Apply captured learnings

**Repository**: https://github.com/pjbeyer/phil-ai-learning

### phil-ai-docs

Hierarchical documentation with audience optimization and multi-platform publishing.

**Features**:
- Audience-specific optimization (human/machine/team/public)
- Multi-platform publishing (Notion, GitHub, local)
- Token-efficient machine documentation

**Commands**:
- `/doc write --audience=<audience>` - Write documentation
- `/doc maintain` - Maintain and update docs
- `/doc optimize` - Optimize for token efficiency
- `/doc publish --platform=<platform>` - Publish to platforms

**Repository**: https://github.com/pjbeyer/phil-ai-docs

### phil-ai-context

Optimize AGENTS.md files, manage MCP configuration, and load context efficiently.

**Features**:
- Smart context loading based on hierarchy level
- Token-efficient AGENTS.md optimization
- MCP configuration management

**Commands**:
- `/optimize-agents` - Optimize AGENTS.md files
- `/optimize-mcp` - Optimize MCP configuration
- `/add-task` - Add hierarchy-aware tasks

**Repository**: https://github.com/pjbeyer/phil-ai-context

### phil-ai-workflow

Work tracking, git integration, and workflow management.

**Features**:
- Issue/branch/task coordination
- Profile-aware workflow commands
- Metrics capture and velocity tracking

**Commands**:
- `/work-start` - Start new work item
- `/work-finish` - Complete and cleanup work
- `/work-status` - Show active work
- `/work-resume` - Resume previous work

**Repository**: https://github.com/pjbeyer/phil-ai-workflow

## Installation

### Claude Code

```bash
# Add marketplace
/plugin marketplace add pjbeyer/phil-ai

# Install plugins
/plugin install phil-ai-learning@phil-ai
/plugin install phil-ai-docs@phil-ai
/plugin install phil-ai-context@phil-ai
/plugin install phil-ai-workflow@phil-ai
```

### OpenCode

```bash
# Install phil-ai system
bunx phil-ai install

# Or install specific capabilities
bunx phil-ai install --skills=learning,docs
```

## Architecture

This monorepo generates the unified OpenCode plugin and coordinates skill definitions:

```
phil-ai/
├── cli/                    # CLI for installation & management
├── mcp/                    # Model Context Protocol server
├── shared/                 # Schemas, storage, versioning utilities
├── platforms/
│   ├── claude-code/        # Claude Code plugin generator
│   └── opencode/           # OpenCode plugin generator
├── core/skills/            # Canonical skill definitions
└── tests/                  # Centralized test suite
```

### Platform Strategy

| Platform | Source | Installation |
|----------|--------|--------------|
| Claude Code | Individual repos | `/plugin install` from marketplace |
| OpenCode | This monorepo | `bunx phil-ai install` |

The individual repos (phil-ai-learning, etc.) remain the source of truth for Claude Code compatibility. This repo generates the unified OpenCode plugin and provides the CLI/MCP infrastructure.

## CLI Commands

```bash
bunx phil-ai install              # First-time installation
bunx phil-ai status               # Check system health
bunx phil-ai update               # Update components
bunx phil-ai sync                 # Sync state across platforms
bunx phil-ai generate             # Generate platform plugins
```

## MCP Server

For OpenCode integration via Model Context Protocol:

```bash
bunx phil-ai-mcp
```

**Available Tools**: `capture_learning`, `list_learnings`, `generate_docs`, `optimize_docs`, `work_start`, `work_finish`

## Hierarchy Levels

1. **Global** (`~/Projects`) - Cross-profile patterns and standards
2. **Profile** (`~/Projects/{profile}`) - Profile-specific tools and workflows
3. **Project** - Project-specific patterns and documentation
4. **Agent** - Agent-specific capabilities and improvements

## Design Principles

1. **Information at the right level** - No duplication across hierarchy
2. **Token efficiency** - Load only relevant context
3. **Closed-loop learning** - Update documentation first
4. **Platform parity** - Consistent behavior across AI assistants

## Development

```bash
bun install          # Install dependencies
bun test             # Run tests
bun run lint         # Biome linting
bun run generate     # Generate platform plugins
```

## License

MIT
