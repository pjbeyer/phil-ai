# Context Skill

Optimize AGENTS.md files, manage MCP configuration, and load context efficiently.

## Commands

### /optimize-agents

Optimize AGENTS.md files for token efficiency.

**Arguments:**
- `--level`: Hierarchy level (global|profile|project)
- `--dry-run`: Preview changes without applying

**Example:**
```
/optimize-agents --level=project --dry-run
```

### /optimize-mcp

Optimize MCP configuration.

**Arguments:**
- `--target`: Optimization target (performance|size|both)

### /add-task

Add hierarchy-aware tasks.

**Arguments:**
- `task`: Task description
- `--level`: Task hierarchy level
- `--priority`: Task priority (P0-P4)

## Context Loading Strategy

1. **Global**: Load cross-profile standards
2. **Profile**: Load profile-specific context
3. **Project**: Load project conventions
4. **Agent**: Load agent-specific optimizations

## Token Optimization

- Remove redundant information at each level
- Use references instead of duplication
- Compress examples when possible
- Prioritize actionable content
