# phil-ai

Claude Code plugins for hierarchical agent systems, documentation management, and continuous learning.

## Available Plugins

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
- 13 specialized skills (writing, management, optimization, orchestration)
- Single `/doc` command with subcommands
- Audience-specific optimization (human/machine/team/public)
- Multi-platform publishing (Notion, GitHub, local)
- Token-efficient machine documentation

**Commands**:
- `/doc write --audience=<audience>` - Write documentation
- `/doc maintain` - Maintain and update docs
- `/doc optimize` - Optimize for token efficiency
- `/doc publish --platform=<platform>` - Publish to platforms
- `/doc curate` - Curate agent documentation
- `/doc coordinate --level=<level>` - Coordinate hierarchical docs
- `/doc organize` - Organize multi-agent systems

**Repository**: https://github.com/pjbeyer/phil-ai-docs

### phil-ai-context

Optimize AGENTS.md files, manage MCP configuration, and load context efficiently.

**Features**:
- 9 specialized skills (optimization, hierarchy, context, tasks)
- Smart context loading based on hierarchy level
- Profile-aware standards (pjbeyer/work/play/home)
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

### Add Marketplace

```bash
/plugin marketplace add pjbeyer/phil-ai
```

### Install Plugins

```bash
/plugin install phil-ai-learning@phil-ai
/plugin install phil-ai-docs@phil-ai
/plugin install phil-ai-context@phil-ai
/plugin install phil-ai-workflow@phil-ai
```

## Principles

### Hierarchy Levels

1. **Global** (`~/Projects`) - Cross-profile patterns and standards
2. **Profile** (`~/Projects/{profile}`) - Profile-specific tools and workflows
3. **Project** - Project-specific patterns and documentation
4. **Agent** - Agent-specific capabilities and improvements

### Design Principles

1. **Information at the right level** - No duplication across hierarchy
2. **Token efficiency** - Load only relevant context
3. **Closed-loop learning** - Update documentation first
4. **Cross-profile patterns** - Share what's common, respect what differs

## Development

### Plugin Naming Convention

All plugins in this marketplace use the `phil-ai-` prefix:
- `phil-ai-learning`
- `phil-ai-docs`
- `phil-ai-context`
- `phil-ai-workflow`

### Contributing

Open source. Contributions welcome via pull requests.

### Testing Locally

For plugin development:

```bash
# Add local marketplace
/plugin marketplace add /Users/pjbeyer/Projects/pjbeyer/agents-marketplace

# Install from local marketplace
/plugin install phil-ai-learning@phil-ai
```

## License

All plugins in this marketplace are released under MIT License.

## Repository

https://github.com/pjbeyer/phil-ai
