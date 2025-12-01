# Phil.ai Rebrand Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebrand all open source plugin components from `agents-*` namespace to `phil-ai` namespace across 5 GitHub repositories.

**Architecture:** GitHub repository renames followed by systematic updates to all internal references (plugin.json, marketplace.json, README.md, cross-plugin references). Local cache cleanup and reinstall to verify.

**Tech Stack:** GitHub CLI (gh), Git, JSON, Markdown

---

## Task 1: Rename GitHub Repositories

**Files:**
- GitHub UI: Settings → General → Repository name (5 repos)

**Step 1: Rename agents-marketplace → phil-ai**

Run in browser or via gh CLI:
```bash
gh repo rename phil-ai --repo pjbeyer/agents-marketplace
```

Expected: Repository accessible at `https://github.com/pjbeyer/phil-ai`

**Step 2: Rename agents-context-system → phil-ai-context**

```bash
gh repo rename phil-ai-context --repo pjbeyer/agents-context-system
```

Expected: Repository accessible at `https://github.com/pjbeyer/phil-ai-context`

**Step 3: Rename agents-documentation-suite → phil-ai-docs**

```bash
gh repo rename phil-ai-docs --repo pjbeyer/agents-documentation-suite
```

Expected: Repository accessible at `https://github.com/pjbeyer/phil-ai-docs`

**Step 4: Rename agents-learning-system → phil-ai-learning**

```bash
gh repo rename phil-ai-learning --repo pjbeyer/agents-learning-system
```

Expected: Repository accessible at `https://github.com/pjbeyer/phil-ai-learning`

**Step 5: Rename agents-workflow-system → phil-ai-workflow**

```bash
gh repo rename phil-ai-workflow --repo pjbeyer/agents-workflow-system
```

Expected: Repository accessible at `https://github.com/pjbeyer/phil-ai-workflow`

**Step 6: Verify all renames**

```bash
gh repo list pjbeyer --json name --jq '.[].name' | grep phil-ai
```

Expected output:
```
phil-ai
phil-ai-context
phil-ai-docs
phil-ai-learning
phil-ai-workflow
```

**Step 7: Commit checkpoint (no code changes yet - just verification)**

No commit needed - GitHub renames are immediate.

---

## Task 2: Update Local Git Remotes

**Files:**
- Modify: `/Users/pjbeyer/Projects/pjbeyer/agents-marketplace/.git/config`

**Step 1: Update marketplace repo remote**

```bash
cd /Users/pjbeyer/Projects/pjbeyer/agents-marketplace
git remote set-url origin git@github.com:pjbeyer/phil-ai.git
```

**Step 2: Verify remote update**

```bash
git remote -v
```

Expected:
```
origin	git@github.com:pjbeyer/phil-ai.git (fetch)
origin	git@github.com:pjbeyer/phil-ai.git (push)
```

**Step 3: Fetch to verify connectivity**

```bash
git fetch origin
```

Expected: Success (no errors)

---

## Task 3: Update Marketplace plugin.json

**Files:**
- Modify: `/Users/pjbeyer/Projects/pjbeyer/agents-marketplace/.claude-plugin/marketplace.json`

**Step 1: Update marketplace name and plugin entries**

Replace entire file with:

```json
{
  "name": "phil-ai",
  "description": "Claude Code plugins for hierarchical agent systems, documentation management, and continuous learning",
  "owner": {
    "name": "Phil Beyer",
    "email": "6152278+pjbeyer@users.noreply.github.com",
    "url": "https://github.com/pjbeyer"
  },
  "plugins": [
    {
      "name": "phil-ai-learning",
      "version": "1.0.0",
      "description": "Capture, track, and implement learnings with hierarchical storage and closed-loop tracking across profiles",
      "source": {
        "source": "url",
        "url": "https://github.com/pjbeyer/phil-ai-learning.git"
      },
      "author": {
        "name": "Phil Beyer",
        "email": "6152278+pjbeyer@users.noreply.github.com"
      },
      "license": "MIT"
    },
    {
      "name": "phil-ai-docs",
      "version": "1.0.0",
      "description": "Hierarchical documentation system with audience specialization (human/machine/team/public) and multi-platform publishing",
      "source": {
        "source": "url",
        "url": "https://github.com/pjbeyer/phil-ai-docs.git"
      },
      "author": {
        "name": "Phil Beyer",
        "email": "6152278+pjbeyer@users.noreply.github.com"
      },
      "license": "MIT"
    },
    {
      "name": "phil-ai-context",
      "version": "1.0.0",
      "description": "Manage hierarchical agent infrastructure, AGENTS.md optimization, MCP configuration, and smart context loading across profiles",
      "source": {
        "source": "url",
        "url": "https://github.com/pjbeyer/phil-ai-context.git"
      },
      "author": {
        "name": "Phil Beyer",
        "email": "6152278+pjbeyer@users.noreply.github.com"
      },
      "license": "MIT"
    },
    {
      "name": "phil-ai-workflow",
      "version": "1.0.0",
      "description": "Work tracking, git integration, and workflow management across profiles",
      "source": {
        "source": "url",
        "url": "https://github.com/pjbeyer/phil-ai-workflow.git"
      },
      "author": {
        "name": "Phil Beyer",
        "email": "6152278+pjbeyer@users.noreply.github.com"
      },
      "license": "MIT"
    }
  ]
}
```

**Step 2: Verify JSON is valid**

```bash
cd /Users/pjbeyer/Projects/pjbeyer/agents-marketplace
cat .claude-plugin/marketplace.json | jq .
```

Expected: Pretty-printed JSON without errors

**Step 3: Commit marketplace.json changes**

```bash
git add .claude-plugin/marketplace.json
git commit -m "chore: rename plugins to phil-ai namespace in marketplace.json"
```

---

## Task 4: Update Marketplace README.md

**Files:**
- Modify: `/Users/pjbeyer/Projects/pjbeyer/agents-marketplace/README.md`

**Step 1: Replace entire README with updated branding**

```markdown
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
```

**Step 2: Commit README changes**

```bash
git add README.md
git commit -m "docs: update README with phil-ai branding"
```

---

## Task 5: Rename Local Directory

**Files:**
- Rename: `/Users/pjbeyer/Projects/pjbeyer/agents-marketplace` → `/Users/pjbeyer/Projects/pjbeyer/phil-ai`

**Step 1: Rename local directory**

```bash
cd /Users/pjbeyer/Projects/pjbeyer
mv agents-marketplace phil-ai
```

**Step 2: Verify directory exists**

```bash
ls -la /Users/pjbeyer/Projects/pjbeyer/phil-ai
```

Expected: Directory listing with .git, README.md, .claude-plugin, docs

**Step 3: Navigate to new directory**

```bash
cd /Users/pjbeyer/Projects/pjbeyer/phil-ai
```

---

## Task 6: Push Marketplace Changes

**Files:**
- Push commits to remote

**Step 1: Push to origin**

```bash
cd /Users/pjbeyer/Projects/pjbeyer/phil-ai
git push origin feature/1-refactor-agents-infrastructure
```

Expected: Success

**Step 2: Verify push**

```bash
git log --oneline -3
```

---

## Task 7: Clone and Update phil-ai-context

**Files:**
- Clone: `phil-ai-context` repo
- Modify: `.claude-plugin/plugin.json`
- Modify: `README.md`
- Modify: All files with `agents-` references

**Step 1: Clone the repo**

```bash
cd /Users/pjbeyer/Projects/pjbeyer
git clone git@github.com:pjbeyer/phil-ai-context.git
cd phil-ai-context
```

**Step 2: Create feature branch**

```bash
git checkout -b feature/rebrand-to-phil-ai
```

**Step 3: Update plugin.json**

Modify `.claude-plugin/plugin.json`:

```json
{
  "name": "phil-ai-context",
  "version": "1.1.0",
  "description": "Manage hierarchical agent infrastructure, AGENTS.md optimization, MCP configuration, and smart context loading across profiles",
  "author": {
    "name": "Phil Beyer",
    "email": "6152278+pjbeyer@users.noreply.github.com"
  },
  "license": "MIT",
  "repository": "https://github.com/pjbeyer/phil-ai-context",
  "keywords": ["agents", "context", "optimization", "hierarchy", "mcp", "token-efficiency"]
}
```

**Step 4: Find and list all files with agents- references**

```bash
grep -r "agents-" --include="*.json" --include="*.md" -l .
```

**Step 5: Update all found files**

For each file found, replace:
- `agents-context-system` → `phil-ai-context`
- `agents-learning-system` → `phil-ai-learning`
- `agents-documentation-suite` → `phil-ai-docs`
- `agents-marketplace` → `phil-ai`
- `agents-workflow-system` → `phil-ai-workflow`

Use:
```bash
find . -type f \( -name "*.json" -o -name "*.md" \) -exec sed -i '' \
  -e 's/agents-context-system/phil-ai-context/g' \
  -e 's/agents-learning-system/phil-ai-learning/g' \
  -e 's/agents-documentation-suite/phil-ai-docs/g' \
  -e 's/agents-workflow-system/phil-ai-workflow/g' \
  -e 's/agents-marketplace/phil-ai/g' \
  {} \;
```

**Step 6: Verify no agents- references remain**

```bash
grep -r "agents-" --include="*.json" --include="*.md" . || echo "No references found - good!"
```

Expected: "No references found - good!"

**Step 7: Commit changes**

```bash
git add -A
git commit -m "chore: rebrand from agents-context-system to phil-ai-context"
```

**Step 8: Push and create PR**

```bash
git push -u origin feature/rebrand-to-phil-ai
gh pr create --title "chore: rebrand to phil-ai-context" --body "Rebrand from agents-context-system to phil-ai namespace."
```

---

## Task 8: Clone and Update phil-ai-docs

**Files:**
- Clone: `phil-ai-docs` repo
- Modify: `.claude-plugin/plugin.json`
- Modify: All files with `agents-` references

**Step 1: Clone the repo**

```bash
cd /Users/pjbeyer/Projects/pjbeyer
git clone git@github.com:pjbeyer/phil-ai-docs.git
cd phil-ai-docs
```

**Step 2: Create feature branch**

```bash
git checkout -b feature/rebrand-to-phil-ai
```

**Step 3: Update plugin.json name and repository**

Modify `.claude-plugin/plugin.json`:
- Change `"name": "agents-documentation-suite"` → `"name": "phil-ai-docs"`
- Change `"repository": "https://github.com/pjbeyer/agents-documentation-suite"` → `"repository": "https://github.com/pjbeyer/phil-ai-docs"`
- Bump version to `1.1.0`

**Step 4: Find and update all files with agents- references**

```bash
find . -type f \( -name "*.json" -o -name "*.md" \) -exec sed -i '' \
  -e 's/agents-context-system/phil-ai-context/g' \
  -e 's/agents-learning-system/phil-ai-learning/g' \
  -e 's/agents-documentation-suite/phil-ai-docs/g' \
  -e 's/agents-workflow-system/phil-ai-workflow/g' \
  -e 's/agents-marketplace/phil-ai/g' \
  {} \;
```

**Step 5: Verify no agents- references remain**

```bash
grep -r "agents-" --include="*.json" --include="*.md" . || echo "No references found - good!"
```

**Step 6: Commit and push**

```bash
git add -A
git commit -m "chore: rebrand from agents-documentation-suite to phil-ai-docs"
git push -u origin feature/rebrand-to-phil-ai
gh pr create --title "chore: rebrand to phil-ai-docs" --body "Rebrand from agents-documentation-suite to phil-ai namespace."
```

---

## Task 9: Clone and Update phil-ai-learning

**Files:**
- Clone: `phil-ai-learning` repo
- Modify: `.claude-plugin/plugin.json`
- Modify: All files with `agents-` references

**Step 1: Clone the repo**

```bash
cd /Users/pjbeyer/Projects/pjbeyer
git clone git@github.com:pjbeyer/phil-ai-learning.git
cd phil-ai-learning
```

**Step 2: Create feature branch**

```bash
git checkout -b feature/rebrand-to-phil-ai
```

**Step 3: Update plugin.json name and repository**

Modify `.claude-plugin/plugin.json`:
- Change `"name": "agents-learning-system"` → `"name": "phil-ai-learning"`
- Change repository URL to `https://github.com/pjbeyer/phil-ai-learning`
- Bump version to `1.1.0`

**Step 4: Find and update all files with agents- references**

```bash
find . -type f \( -name "*.json" -o -name "*.md" \) -exec sed -i '' \
  -e 's/agents-context-system/phil-ai-context/g' \
  -e 's/agents-learning-system/phil-ai-learning/g' \
  -e 's/agents-documentation-suite/phil-ai-docs/g' \
  -e 's/agents-workflow-system/phil-ai-workflow/g' \
  -e 's/agents-marketplace/phil-ai/g' \
  {} \;
```

**Step 5: Verify and commit**

```bash
grep -r "agents-" --include="*.json" --include="*.md" . || echo "No references found - good!"
git add -A
git commit -m "chore: rebrand from agents-learning-system to phil-ai-learning"
git push -u origin feature/rebrand-to-phil-ai
gh pr create --title "chore: rebrand to phil-ai-learning" --body "Rebrand from agents-learning-system to phil-ai namespace."
```

---

## Task 10: Clone and Update phil-ai-workflow

**Files:**
- Clone: `phil-ai-workflow` repo
- Modify: `.claude-plugin/plugin.json`
- Modify: All files with `agents-` references

**Step 1: Clone the repo**

```bash
cd /Users/pjbeyer/Projects/pjbeyer
git clone git@github.com:pjbeyer/phil-ai-workflow.git
cd phil-ai-workflow
```

**Step 2: Create feature branch**

```bash
git checkout -b feature/rebrand-to-phil-ai
```

**Step 3: Update plugin.json name and repository**

Modify `.claude-plugin/plugin.json`:
- Change name to `phil-ai-workflow`
- Change repository URL to `https://github.com/pjbeyer/phil-ai-workflow`
- Bump version

**Step 4: Find and update all files with agents- references**

```bash
find . -type f \( -name "*.json" -o -name "*.md" \) -exec sed -i '' \
  -e 's/agents-context-system/phil-ai-context/g' \
  -e 's/agents-learning-system/phil-ai-learning/g' \
  -e 's/agents-documentation-suite/phil-ai-docs/g' \
  -e 's/agents-workflow-system/phil-ai-workflow/g' \
  -e 's/agents-marketplace/phil-ai/g' \
  {} \;
```

**Step 5: Verify and commit**

```bash
grep -r "agents-" --include="*.json" --include="*.md" . || echo "No references found - good!"
git add -A
git commit -m "chore: rebrand from agents-workflow-system to phil-ai-workflow"
git push -u origin feature/rebrand-to-phil-ai
gh pr create --title "chore: rebrand to phil-ai-workflow" --body "Rebrand from agents-workflow-system to phil-ai namespace."
```

---

## Task 11: Merge All PRs

**Files:**
- GitHub PRs in each repo

**Step 1: Merge phil-ai-context PR**

```bash
cd /Users/pjbeyer/Projects/pjbeyer/phil-ai-context
gh pr merge --squash --delete-branch
```

**Step 2: Merge phil-ai-docs PR**

```bash
cd /Users/pjbeyer/Projects/pjbeyer/phil-ai-docs
gh pr merge --squash --delete-branch
```

**Step 3: Merge phil-ai-learning PR**

```bash
cd /Users/pjbeyer/Projects/pjbeyer/phil-ai-learning
gh pr merge --squash --delete-branch
```

**Step 4: Merge phil-ai-workflow PR**

```bash
cd /Users/pjbeyer/Projects/pjbeyer/phil-ai-workflow
gh pr merge --squash --delete-branch
```

---

## Task 12: Local Cache Cleanup

**Files:**
- Remove: `~/.claude/plugins/cache/agents-*`

**Step 1: Remove old cache directories**

```bash
rm -rf ~/.claude/plugins/cache/agents-context-system
rm -rf ~/.claude/plugins/cache/agents-documentation-suite
rm -rf ~/.claude/plugins/cache/agents-learning-system
```

**Step 2: Verify removal**

```bash
ls ~/.claude/plugins/cache/ | grep agents
```

Expected: No output (no agents- directories)

---

## Task 13: Update Marketplace Registration

**Files:**
- Claude Code plugin system

**Step 1: Remove old marketplace**

```bash
/plugin marketplace remove agents-marketplace
```

**Step 2: Add new marketplace**

```bash
/plugin marketplace add pjbeyer/phil-ai
```

**Step 3: Verify marketplace added**

```bash
/plugin marketplace list
```

Expected: `phil-ai` in list

---

## Task 14: Install Plugins from New Marketplace

**Files:**
- Claude Code plugin system

**Step 1: Install phil-ai-context**

```bash
/plugin install phil-ai-context@phil-ai
```

**Step 2: Install phil-ai-docs**

```bash
/plugin install phil-ai-docs@phil-ai
```

**Step 3: Install phil-ai-learning**

```bash
/plugin install phil-ai-learning@phil-ai
```

**Step 4: Install phil-ai-workflow**

```bash
/plugin install phil-ai-workflow@phil-ai
```

**Step 5: Verify installations**

```bash
ls ~/.claude/plugins/cache/ | grep phil-ai
```

Expected:
```
phil-ai-context
phil-ai-docs
phil-ai-learning
phil-ai-workflow
```

---

## Task 15: Verification

**Files:**
- All repos and plugins

**Step 1: Verify GitHub repos accessible**

```bash
gh repo list pjbeyer --json name --jq '.[].name' | grep phil-ai
```

Expected: 5 repos listed

**Step 2: Verify no agents- references in any plugin**

```bash
grep -r "agents-" ~/.claude/plugins/cache/phil-ai-* --include="*.json" --include="*.md" || echo "Clean - no old references!"
```

Expected: "Clean - no old references!"

**Step 3: Test a command from each plugin**

- Run `/optimize-agents` - should work from phil-ai-context
- Run `/doc` - should work from phil-ai-docs
- Run `/learn` - should work from phil-ai-learning

**Step 4: Update Issue #1 and close**

```bash
cd /Users/pjbeyer/Projects/pjbeyer/phil-ai
gh issue close 1 --comment "Rebrand complete. All 5 repos renamed to phil-ai namespace. Plugins verified working."
```

---

## Task 16: Final Commit on Marketplace Branch

**Files:**
- Merge marketplace feature branch

**Step 1: Create PR for marketplace changes**

```bash
cd /Users/pjbeyer/Projects/pjbeyer/phil-ai
gh pr create --title "feat: rebrand to phil-ai namespace" --body "Complete rebrand of agents-marketplace to phil-ai namespace.

## Changes
- Renamed repository from agents-marketplace to phil-ai
- Updated marketplace.json with new plugin names and URLs
- Updated README.md with new branding
- Added phil-ai-workflow to marketplace

## Verification
- All 5 GitHub repos renamed and accessible
- All plugins install correctly from new marketplace
- No agents- references remain in codebase"
```

**Step 2: Merge PR**

```bash
gh pr merge --squash --delete-branch
```

**Step 3: Checkout main and pull**

```bash
git checkout main
git pull origin main
```

---

## Summary

| Task | Action | Files |
|------|--------|-------|
| 1 | Rename 5 GitHub repos | GitHub UI |
| 2 | Update local remote URL | .git/config |
| 3 | Update marketplace.json | .claude-plugin/marketplace.json |
| 4 | Update marketplace README | README.md |
| 5 | Rename local directory | Directory rename |
| 6 | Push marketplace changes | Git push |
| 7-10 | Update each plugin repo | plugin.json, README, etc. |
| 11 | Merge all PRs | GitHub |
| 12 | Clean local cache | ~/.claude/plugins/cache |
| 13 | Update marketplace registration | Plugin system |
| 14 | Install new plugins | Plugin system |
| 15 | Verification | All |
| 16 | Final merge | Git |
