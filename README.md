# agents-marketplace

Claude Code plugins for hierarchical agent systems, documentation management, and continuous learning.

## Available Plugins

### agents-learning-system

Capture and implement learnings with hierarchical storage and closed-loop tracking.

**Features**:
- Hierarchical storage (global/profile/project/agent)
- Closed-loop tracking with documentation-first approach
- Cross-profile pattern extraction
- Robust search across all profiles

**Commands**:
- `/learn` - Capture a learning
- `/implement-learnings` - Apply captured learnings

**Repository**: https://github.com/pjbeyer/agents-learning-system

### agents-documentation-suite

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

**Repository**: https://github.com/pjbeyer/agents-documentation-suite

### agents-context-system

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

**Repository**: https://github.com/pjbeyer/agents-context-system

## Installation

### Add Marketplace

```bash
/plugin marketplace add pjbeyer/agents-marketplace
```

### Install Plugins

```bash
/plugin install agents-learning-system@agents-marketplace
/plugin install agents-documentation-suite@agents-marketplace
/plugin install agents-context-system@agents-marketplace
```

## Principles

### Hierarchy Levels

1. **Global** (`~/Projects`) - Cross-profile patterns and standards
2. **Profile** (`~/Projects/{profile}`) - Profile-specific tools and workflows
3. **Project** - Project-specific patterns and documentation
4. **Agent** - Agent-specific capabilities and improvements

1. **Information at the right level** - No duplication across hierarchy
2. **Token efficiency** - Load only relevant context
3. **Closed-loop learning** - Update documentation first
4. **Cross-profile patterns** - Share what's common, respect what differs

## Development

### Plugin Naming Convention

All plugins in this marketplace use the `agents-` prefix:
- `agents-learning-system`
- `agents-documentation-suite`
- `agents-context-system`

### Contributing

Open source. Contributions welcome via pull requests.

### Testing Locally

For plugin development:

```bash
# Add local marketplace
/plugin marketplace add /Users/pjbeyer/Projects/pjbeyer/agents-marketplace

# Install from local marketplace
/plugin install agents-learning-system@agents-marketplace
```

## License

All plugins in this marketplace are released under MIT License.

## Repository

https://github.com/pjbeyer/agents-marketplace
