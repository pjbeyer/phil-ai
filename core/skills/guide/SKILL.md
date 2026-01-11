# Guide Skill

System Guide for user preferences and workflow patterns. Consult this guide at session start.

## Loading the Guide

At session start, load the merged guide for the current project context. The guide is stored in `GUIDE.md` files at hierarchy levels:

1. **Global** (`~/Projects/GUIDE.md`) - Cross-project preferences
2. **Profile** (`~/Projects/{profile}/GUIDE.md`) - Profile-specific preferences
3. **Project** (`{project}/GUIDE.md`) - Project-specific preferences

Lower levels override higher levels. Project preferences take precedence.

## Preference Types

### Hard Preferences

Rules that MUST be followed. Marked with `| hard` in the guide:

```markdown
<!-- preference: code-style.explicit-types | hard -->
Always use explicit TypeScript types; avoid `any`.
```

When a hard preference applies, follow it without asking.

### Soft Preferences

Defaults that CAN be overridden. Marked with `| soft` in the guide:

```markdown
<!-- preference: comm.concise | soft -->
Keep responses concise; avoid unnecessary preamble.
```

Apply soft preferences unless the user explicitly requests otherwise.

## Verbosity Levels

The guide specifies how to acknowledge preferences:

- **silent**: Apply preferences without mentioning them
- **brief**: Add inline note: `[per guide: preference-id]`
- **verbose**: Summarize active preferences at session start

## When User Diverges from Guide

If the user explicitly requests something that contradicts a documented preference:

1. Acknowledge the divergence briefly
2. Proceed with the user's explicit instruction
3. Do NOT repeatedly remind about the preference

## MCP Tools

### get_guide

Returns the merged guide for a project path.

### list_preferences

Lists all active preferences, optionally filtered by type (hard/soft).

### check_preference

Checks if a specific preference ID is defined and returns its details.
