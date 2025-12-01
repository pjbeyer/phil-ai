# Phil.ai Rebrand Design

**Date:** 2025-12-01
**Issue:** #1 - Refactor Agents Infrastructure - Implement phil.ai
**Status:** Approved

## Overview

Rebrand all open source plugin components from `agents-*` namespace to `phil.ai` namespace.

**Drivers:**
- Public visibility and discoverability
- Personal identity/brand alignment
- Namespace cleanup and consistency

**Scope:** Full rebrand - GitHub repos, plugin names, cache directories, all internal references.

---

## Section 1: Naming Scheme

| Current | New | Purpose |
|---------|-----|---------|
| `agents-marketplace` | `phil-ai` | Umbrella marketplace repo |
| `agents-context-system` | `phil-ai-context` | AGENTS.md optimization, MCP config |
| `agents-documentation-suite` | `phil-ai-docs` | Documentation management |
| `agents-learning-system` | `phil-ai-learning` | Continuous improvement system |
| `agents-workflow-system` | `phil-ai-workflow` | Work tracking, git integration |

---

## Section 2: Implementation Scope

### GitHub Repository Changes
- Rename 5 repositories via GitHub settings (Settings → General → Repository name)
- Update repository descriptions to reflect phil.ai branding
- Update all internal cross-references between repos

### Plugin Configuration Changes (per plugin)

1. **plugin.json** - Update:
   - `name` field (e.g., `agents-context-system` → `phil-ai-context`)
   - `repository` URL (after GitHub rename)
   - Any references to sibling plugins

2. **README.md** - Update:
   - Plugin name throughout
   - Installation commands (`/plugin install phil-ai-context@phil-ai`)
   - Repository URLs

3. **AGENTS.md** - Update:
   - Plugin name references
   - Cross-plugin references

4. **Skills/Commands** - Internal references to plugin names

### Marketplace Changes (phil-ai repo)

1. **marketplace.json** - Update all plugin entries with new names and repo URLs
2. **README.md** - Update plugin listing, installation examples
3. **Directory structure** - If any plugin directories exist, rename them

### Local Environment
- Remove old cache directories: `~/.claude/plugins/cache/agents-*`
- Reinstall plugins with new names
- Update any local settings referencing old names

### Order of Operations
1. GitHub renames (all 5 repos)
2. Update marketplace.json in phil-ai repo
3. Update each plugin's internal files
4. Push all changes
5. Clean local cache and reinstall

---

## Section 3: Risk Mitigation

### GitHub Rename Behavior
- GitHub automatically redirects old URLs to new ones (temporary)
- Redirects break if someone else claims the old name
- Since user is the only user, this is low risk

### Potential Issues & Mitigations

| Risk | Mitigation |
|------|------------|
| Broken cross-repo references | Update all repos in same session before pushing |
| Stale local cache | Document cleanup commands in migration notes |
| Forgotten references | Use grep across all repos before finalizing |
| Git remote URLs outdated | Update local `.git/config` remotes after rename |

### Verification Checklist
1. All 5 GitHub repos accessible at new URLs
2. `marketplace.json` references valid repo URLs
3. `/plugin install phil-ai-context@phil-ai` works
4. Each plugin loads without errors
5. Commands/skills function correctly
6. No references to `agents-` remain in codebase

### Rollback Strategy
- GitHub allows renaming back within redirect window
- Keep local backup of all repos before starting
- If partial failure: complete remaining renames rather than rollback

### Search Patterns for Cleanup
```bash
# Find all old references
grep -r "agents-marketplace" .
grep -r "agents-context-system" .
grep -r "agents-documentation-suite" .
grep -r "agents-learning-system" .
grep -r "agents-workflow-system" .
```

---

## Section 4: Execution Plan

### Phase 1: GitHub Renames (5-10 min)
1. Rename `agents-marketplace` → `phil-ai`
2. Rename `agents-context-system` → `phil-ai-context`
3. Rename `agents-documentation-suite` → `phil-ai-docs`
4. Rename `agents-learning-system` → `phil-ai-learning`
5. Rename `agents-workflow-system` → `phil-ai-workflow`

### Phase 2: Update Local Remotes
```bash
# For each local repo, update origin URL
git remote set-url origin git@github.com:pjbeyer/phil-ai.git
```

### Phase 3: Update Marketplace (phil-ai repo)
1. Update `marketplace.json` with new plugin names/URLs
2. Update `README.md` with new branding
3. Commit and push

### Phase 4: Update Each Plugin
For each of the 4 plugins:
1. Update `plugin.json` (name, repository)
2. Update `README.md`
3. Update `AGENTS.md` if present
4. Search for and update any internal references
5. Commit and push

### Phase 5: Local Cleanup
```bash
rm -rf ~/.claude/plugins/cache/agents-*
/plugin marketplace remove agents-marketplace
/plugin marketplace add pjbeyer/phil-ai
/plugin install phil-ai-context@phil-ai
# ... install remaining plugins
```

### Phase 6: Verification
- Run verification checklist from Section 3
- Test each plugin's commands/skills
