# Learning Skill

Capture and implement learnings with hierarchical storage and closed-loop tracking.

## Commands

### /learn

Capture a new learning.

**Arguments:**
- `title` (required): Brief title describing the learning
- `--level`: Hierarchy level (global|profile|project|agent), default: project
- `--priority`: Priority level (P0-P4), default: P3
- `--category`: Category for organization

**Example:**
```
/learn "Use proper-lockfile for concurrent file access" --level=global --category=tools
```

### /implement-learnings

Apply captured learnings to documentation.

**Arguments:**
- `--status`: Filter by status (open|in-progress|testing|blocked|closed)
- `--level`: Filter by hierarchy level
- `--limit`: Maximum learnings to process

## Hierarchy Levels

1. **Global** - Cross-profile patterns applicable everywhere
2. **Profile** - Profile-specific tools and workflows
3. **Project** - Project-specific patterns
4. **Agent** - Agent-specific improvements

## Workflow

1. Capture learning with `/learn`
2. Learning stored at appropriate hierarchy level
3. When ready, use `/implement-learnings` to apply
4. Documentation updated first (closed-loop)
5. Learning marked as implemented
