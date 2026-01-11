# Feature Specification: System Guide

**Feature Branch**: `003-system-guide`  
**Created**: 2026-01-11  
**Status**: Draft  
**Input**: User description: "Create a system guide tool for phil-ai that helps coding agents understand user preferences, workflow, and intent"

## Clarifications

### Session 2026-01-11

- Q: What format should the System Guide use? → A: Markdown with YAML frontmatter (aligns with Claude Code subagent and phil-ai skill patterns)
- Q: Where should guides be stored in the hierarchy? → A: Alongside AGENTS.md files at each hierarchy level (global/profile/project)
- Q: What should be explicitly OUT of scope for MVP? → A: Agent-suggested updates, versioning/migration, import/export functionality
- Q: How should preferences be uniquely identified? → A: Human-readable slugs with dot-notation (e.g., "code-style.prefer-explicit-types")
- Q: How verbose should agent acknowledgment be? → A: Configurable verbosity with default to brief inline notes

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agent Consults Guide Before Acting (Priority: P1)

As a developer using phil-ai, I want coding agents to automatically consult a system guide before starting work so that they understand my preferences, workflow expectations, and phil-ai's architectural intent without me having to explain it every session.

**Why this priority**: This is the core value proposition - reducing cognitive overhead for the user by eliminating repetitive explanations. Every interaction benefits from agents understanding context upfront.

**Independent Test**: Can be fully tested by having an agent start a new session and verifying it loads and applies guide content before taking action.

**Acceptance Scenarios**:

1. **Given** a new agent session, **When** the agent receives a task, **Then** it consults the system guide before responding
2. **Given** an active agent session, **When** the user requests a change that aligns with documented preferences, **Then** the agent applies those preferences without asking for clarification
3. **Given** an active agent session, **When** the user requests something that contradicts documented preferences, **Then** the agent acknowledges the divergence and proceeds with the user's explicit instruction

---

### User Story 2 - User Updates Preferences (Priority: P2)

As a developer, I want to update my preferences and workflow documentation so that agents can adapt to my evolving needs without requiring me to repeat instructions across sessions.

**Why this priority**: Preferences change over time. The system must support updates to remain useful long-term.

**Independent Test**: Can be fully tested by updating a preference and verifying agents in subsequent sessions reflect the change.

**Acceptance Scenarios**:

1. **Given** an existing system guide, **When** the user updates a preference, **Then** the change is persisted and available to future agent sessions
2. **Given** a user wanting to add a new preference, **When** they use the provided interface, **Then** the new preference is validated and stored in the appropriate section

---

### User Story 3 - Agent Suggests Guide Updates (Priority: P3) *(OUT OF SCOPE FOR MVP)*

As a developer, I want agents to suggest updates to my system guide when they observe patterns in my feedback so that my preferences are captured without manual effort.

**Why this priority**: Reduces friction in maintaining preferences by leveraging agent observations. Valuable but not essential for MVP.

**MVP Exclusion Rationale**: Requires pattern recognition logic and adds significant implementation complexity. Deferred to post-MVP iteration.

**Independent Test**: Can be fully tested by having an agent observe repeated corrections and verifying it suggests a guide update.

**Acceptance Scenarios**:

1. **Given** an agent session where the user corrects agent behavior multiple times in the same way, **When** the pattern is recognized, **Then** the agent suggests adding this preference to the guide
2. **Given** a suggested update, **When** the user approves it, **Then** the preference is added to the guide

---

### User Story 4 - Multi-Platform Consistency (Priority: P3)

As a developer using both Claude Code and OpenCode, I want my system guide to work consistently across platforms so that my preferences apply regardless of which tool I'm using.

**Why this priority**: phil-ai supports multiple platforms; consistency is important but can be addressed after core functionality works.

**Independent Test**: Can be fully tested by creating a guide in one platform and verifying it loads correctly in another.

**Acceptance Scenarios**:

1. **Given** a system guide created in Claude Code, **When** accessed from OpenCode, **Then** the same preferences are available and applicable
2. **Given** platform-specific preferences, **When** accessed from a different platform, **Then** platform-specific content is appropriately filtered or marked

---

### Edge Cases

- What happens when the system guide doesn't exist yet? System provides a helpful onboarding flow to create initial preferences.
- How does the system handle conflicting preferences at different hierarchy levels? Lower-level (more specific) preferences override higher-level ones, with conflicts flagged for user resolution.
- What happens when an agent encounters an ambiguous situation not covered by the guide? Agent proceeds with reasonable defaults and may suggest adding clarification to the guide.
- How does the system handle outdated or deprecated preferences? Users can mark preferences as inactive; agents ignore inactive preferences but preserve them for reference.

## Out of Scope (MVP)

The following are explicitly **excluded** from the MVP implementation:

- **Agent-Suggested Updates**: Automatic pattern recognition and suggestion of new preferences (User Story 3)
- **Guide Versioning**: Schema migration, version history, rollback capabilities
- **Import/Export**: Sharing guides between users or backing up guide content
- **Conflict Resolution UI**: Visual interface for resolving hierarchy conflicts (CLI feedback only)
- **Analytics**: Tracking which preferences are most/least used

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a structured format for documenting user preferences, workflow patterns, and phil-ai architectural intent using Markdown with YAML frontmatter
- **FR-002**: System MUST make guide content accessible to agents before they begin processing user requests
- **FR-003**: System MUST support hierarchical guide organization (global preferences, profile-specific, project-specific) stored alongside AGENTS.md files
- **FR-004**: System MUST persist guide content across sessions and platform restarts
- **FR-005**: System MUST provide a mechanism for users to view and edit guide content (direct file editing supported; CLI commands optional)
- **FR-006**: System MUST distinguish between hard preferences (rules to always follow) and soft preferences (defaults that can be overridden) via YAML frontmatter fields
- **FR-007**: System MUST allow users to intentionally diverge from preferences without triggering errors
- **FR-008**: Agents MUST acknowledge when guide content influences their behavior with configurable verbosity (silent/brief/verbose), defaulting to brief inline notes
- **FR-009**: System MUST support guide content with metadata in YAML frontmatter (name, version, level, verbosity) and preferences in the Markdown body using a structured format
- **FR-010**: System MUST integrate with existing phil-ai skills (learning, docs, context, workflow) by following the same hierarchy patterns

### Guide File Format

The System Guide uses Markdown with YAML frontmatter, similar to Claude Code subagents and phil-ai skills:

```markdown
---
name: system-guide
version: "1.0.0"
level: project  # global | profile | project
verbosity: brief  # silent | brief | verbose
---

# System Guide

## Code Style

<!-- preference: code-style.explicit-types | hard -->
Always use explicit TypeScript types; avoid `any`.

<!-- preference: code-style.naming | soft -->
Prefer descriptive variable names over abbreviations.

## Communication

<!-- preference: comm.concise | soft -->
Keep responses concise; avoid unnecessary preamble.
```

**Format Notes:**
- **Frontmatter**: Contains only metadata (`name`, `version`, `level`, `verbosity`)
- **Body**: Contains preferences as Markdown prose with HTML comment markers
- **Preference Markers**: `<!-- preference: {id} | {type} -->` where type is `hard` or `soft`
- **Human-First**: The body is fully readable without parsing; markers are unobtrusive

### Key Entities

- **System Guide**: The primary document containing user preferences, workflow patterns, and intent. Uses Markdown with YAML frontmatter. Stored as `GUIDE.md` alongside `AGENTS.md` at each hierarchy level.
- **Preference**: An individual documented preference with:
  - `id`: Human-readable slug with dot-notation (e.g., "code-style.prefer-explicit-types")
  - `type`: hard (always follow) or soft (default, can override)
  - `scope`: Inherited from guide file location (global/profile/project)
  - `content`: Natural language description of the preference
- **Guide Section**: A logical grouping of related preferences (e.g., "Code Style", "Communication", "Decision Making") represented as Markdown headings
- **Override**: A record of when a user intentionally diverged from a preference, logged in agent session context (not persisted)

### File Locations

| Level | Path | Example |
|-------|------|---------|
| Global | `~/Projects/GUIDE.md` | Cross-project preferences |
| Profile | `~/Projects/{profile}/GUIDE.md` | Profile-specific (e.g., pjbeyer) |
| Project | `{project}/GUIDE.md` | Project-specific preferences |

Lower-level guides override higher-level guides. Preferences are merged with project > profile > global precedence.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a functional system guide in under 5 minutes through guided setup or manual file creation
- **SC-002**: 80% of user preferences are correctly applied by agents without explicit reminders
- **SC-003**: Users report reduced need to repeat instructions across sessions (target: 70% reduction in repetitive clarifications)
- **SC-004**: Guide content loads and is available to agents within 2 seconds of session start
- **SC-005**: Users can update any preference in under 30 seconds via direct file edit
- **SC-006**: Guide works identically across Claude Code and OpenCode platforms

## Assumptions

- Users have existing phil-ai installation with at least one skill configured
- Guide content will be stored using phil-ai's existing hierarchical storage conventions (alongside AGENTS.md)
- Agents have access to standard file reading capabilities
- Users are willing to invest initial time to document their preferences
- The existing phil-ai skill pattern (skill.json + SKILL.md) provides sufficient precedent for the guide format
- Users are comfortable editing Markdown files directly (no GUI required for MVP)

## Technical Notes

### Integration Points

1. **Platform Generators**: Both Claude Code and OpenCode generators must be updated to:
   - Look for GUIDE.md files at hierarchy levels
   - Inject guide content into agent context/prompts
   - Respect verbosity settings

2. **Existing Skills**: The guide skill should integrate with:
   - `learning` skill: Learnings can suggest guide updates (post-MVP)
   - `context` skill: Guide content is part of context loading
   - `docs` skill: Guide follows similar Markdown conventions

3. **CLI**: Optional `/guide` command for:
   - `phil-ai guide init` - Create initial guide with prompts
   - `phil-ai guide show` - Display merged guide for current context
   - `phil-ai guide validate` - Check guide syntax and conflicts
