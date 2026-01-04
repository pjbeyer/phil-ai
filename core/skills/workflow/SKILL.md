# Workflow Skill

Work tracking, git integration, and workflow management.

## Commands

### /work-start

Start a new work item.

**Arguments:**
- `title`: Work item title
- `--type`: Work type (feature|bug|chore|refactor)
- `--branch`: Create git branch (default: true)

**Example:**
```
/work-start "Add user authentication" --type=feature
```

### /work-finish

Complete and cleanup current work.

**Arguments:**
- `--commit`: Create commit (default: true)
- `--pr`: Create pull request (default: false)

### /work-status

Show active work items.

**Arguments:**
- `--all`: Show all work items, not just active

### /work-resume

Resume previous work item.

**Arguments:**
- `id`: Work item ID to resume

## Git Integration

- Automatic branch creation with naming convention
- Commit message templates
- PR description generation
- Branch cleanup on completion

## Metrics

- Work item duration tracking
- Velocity calculation
- Pattern detection across work items
