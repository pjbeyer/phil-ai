# Feature Specification: Multi-Platform Phil-AI Scaffolding

**Feature Branch**: `001-multiplatform-scaffolding`  
**Created**: 2026-01-02  
**Status**: Draft  
**Input**: User description: "Create scaffolding for multi-platform phil-ai system"

## Scope

This scaffolding creates the unified architecture that integrates the four existing phil-ai plugins (learning, docs, context, workflow) into a cross-platform system. The scaffolding includes:

- Directory structure for core definitions, MCP server, CLI, and platform generators
- Configuration files for both Claude Code and OpenCode platforms
- Generators that produce working platform-specific plugins from shared core definitions
- Integration layer connecting existing plugin functionality

**Out of Scope**: Rewriting existing plugin functionality; this effort preserves and integrates existing working code.

## Clarifications

### Session 2026-01-02

- Q: Should scaffolding include working implementations or only structure? → A: Structure + integration (directory layout, configs, generators that produce working plugins from existing code)
- Q: How should state be shared between platforms? → A: Single shared storage (both platforms read/write same files at `~/.local/share/phil-ai/`)
- Q: What storage format for private state? → A: Human-readable files (JSON/YAML), one file per entity type
- Q: How is the CLI distributed? → A: Bun package (`bunx phil-ai install`)
- Q: How to handle concurrent access to shared storage? → A: File locking with retry/backoff
- Q: Where should user configuration be stored? → A: XDG standard (`~/.config/phil-ai/`)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Install Phil-AI System (Priority: P1)

As a developer, I want to install the phil-ai system on my machine so I can use its capabilities across both Claude Code and OpenCode platforms.

**Why this priority**: Installation is the entry point for all users. Without a working installation mechanism, no other features are accessible.

**Independent Test**: Can be fully tested by running the install command and verifying the system reports healthy status.

**Acceptance Scenarios**:

1. **Given** a machine without phil-ai installed, **When** I run the installation command, **Then** all required components are installed and the system reports success
2. **Given** phil-ai is already installed, **When** I run the installation command again, **Then** the system updates existing components without data loss
3. **Given** a machine with partial installation, **When** I run the installation command, **Then** missing components are installed and existing ones are preserved

---

### User Story 2 - Check System Health (Priority: P2)

As a developer, I want to check the status of my phil-ai installation so I can verify all components are working correctly and identify any issues.

**Why this priority**: Health checking enables troubleshooting and builds confidence that the system is ready to use.

**Independent Test**: Can be fully tested by running the status command and verifying output shows all component states.

**Acceptance Scenarios**:

1. **Given** phil-ai is fully installed, **When** I check system status, **Then** I see the health status of all components (core, platforms, storage)
2. **Given** one or more components are unhealthy, **When** I check system status, **Then** the unhealthy components are clearly identified with actionable guidance
3. **Given** phil-ai is not installed, **When** I check system status, **Then** I receive a clear message indicating installation is required

---

### User Story 3 - Use Phil-AI on Claude Code (Priority: P3)

As a Claude Code user, I want phil-ai functionality available as plugins so I can access learnings, documentation, context management, and workflow features within Claude Code.

**Why this priority**: Claude Code is one of the two target platforms. Plugin availability enables the core value proposition.

**Independent Test**: Can be tested by installing the Claude Code plugins and verifying commands are available.

**Acceptance Scenarios**:

1. **Given** phil-ai is installed, **When** I add the phil-ai marketplace to Claude Code, **Then** all four plugins (learning, docs, context, workflow) are available for installation
2. **Given** the plugins are installed, **When** I invoke a plugin command, **Then** the command executes and returns expected results
3. **Given** a plugin requires permissions, **When** I use that plugin, **Then** the permission requirements are clearly documented

---

### User Story 4 - Use Phil-AI on OpenCode (Priority: P4)

As an OpenCode user, I want phil-ai functionality available as a plugin so I can access the same capabilities I have in Claude Code.

**Why this priority**: OpenCode is the second target platform. Feature parity across platforms is essential.

**Independent Test**: Can be tested by loading the OpenCode plugin and verifying tools are available.

**Acceptance Scenarios**:

1. **Given** phil-ai is installed, **When** I configure phil-ai as an OpenCode plugin, **Then** the plugin loads without errors
2. **Given** the plugin is loaded, **When** I use phil-ai functionality, **Then** the behavior matches the equivalent Claude Code functionality
3. **Given** I have data from Claude Code usage, **When** I use OpenCode, **Then** my learnings and state are accessible from both platforms

---

### Edge Cases

- What happens when installation fails partway through? System provides rollback or recovery guidance.
- What happens when platform-specific files cannot be generated? Clear error message with manual remediation steps.
- How does the system handle version mismatches between core and platform components? Version compatibility is checked and reported.
- What happens when private storage location is not writable? System detects and reports the issue with suggested fixes.
- What happens when multiple platforms access storage simultaneously? File locking prevents concurrent writes; blocked operations retry with backoff.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a command-line interface (distributed as Bun package, invocable via `bunx phil-ai`) for installation, updates, and status checks
- **FR-002**: System MUST create and maintain a private data storage location (`~/.local/share/phil-ai/`) for learnings, patterns, and state, shared by all platforms
- **FR-003**: System MUST store configuration in XDG standard location (`~/.config/phil-ai/`) separate from private data
- **FR-004**: System MUST generate platform-specific plugin files from shared core definitions
- **FR-005**: System MUST validate that generated plugins conform to each platform's requirements
- **FR-006**: System MUST track version information for all components and stored data
- **FR-007**: System MUST detect and report version mismatches between components
- **FR-008**: System MUST provide clear documentation of required permissions for each platform
- **FR-009**: System MUST support installation without requiring administrative privileges
- **FR-010**: System MUST preserve existing user data when updating to new versions

### Key Entities

- **Core Skill**: A platform-agnostic capability definition that describes what the system can do, stored in the core directory
- **Platform Plugin**: A platform-specific implementation generated from core skills, formatted for Claude Code or OpenCode
- **Private State**: User-specific data including learnings, patterns, and operational state stored as human-readable files (JSON/YAML) in the private data location, one file per entity type
- **Configuration**: User preferences and settings stored in XDG config location (`~/.config/phil-ai/`)
- **Component Version**: Version metadata attached to each major system component enabling compatibility checking

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New users can complete installation in under 5 minutes following documented steps
- **SC-002**: System status check completes in under 10 seconds and provides actionable information
- **SC-003**: 100% of core functionality is available on both Claude Code and OpenCode platforms
- **SC-004**: Users can switch between platforms without losing access to their learnings and state
- **SC-005**: Version updates preserve all existing user data with zero data loss
- **SC-006**: System correctly detects and reports 100% of version incompatibilities before they cause errors
- **SC-007**: All permission requirements are documented and verifiable before first use
