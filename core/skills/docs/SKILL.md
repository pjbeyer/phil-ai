# Docs Skill

Hierarchical documentation with audience optimization and multi-platform publishing.

## Commands

### /doc write

Write documentation with audience targeting.

**Arguments:**
- `--audience`: Target audience (human|machine|team|public)
- `--type`: Document type (readme|api|architecture|guide)
- `--level`: Hierarchy level for context

**Example:**
```
/doc write --audience=machine --type=api
```

### /doc maintain

Maintain and update existing documentation.

### /doc optimize

Optimize documentation for token efficiency.

**Arguments:**
- `--target`: Optimization target (tokens|readability|both)

### /doc publish

Publish documentation to platforms.

**Arguments:**
- `--platform`: Target platform (notion|github|local)

## Audience Optimization

- **Human**: Verbose explanations, examples, context
- **Machine**: Token-efficient, structured, reference-focused
- **Team**: Internal conventions, assumptions documented
- **Public**: Complete context, no assumptions

## Best Practices

1. Identify audience before writing
2. Use progressive disclosure for complex topics
3. Keep machine documentation under token limits
4. Update documentation before code (closed-loop)
