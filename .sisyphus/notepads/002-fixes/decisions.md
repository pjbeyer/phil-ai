# Decisions: 002-scaffold-command Fixes

## [2026-01-13] Decision: Use Runtime Detection for Path Resolution

**Context**: Plugin needs to load commands from different locations depending on whether it's running from `.opencode/plugin/` (local dev) or `dist/` (npm package).

**Options Considered**:
1. Use absolute path based on package.json location
2. Use environment variable to indicate context
3. Detect context via `import.meta.dir.includes('.opencode/plugin')`

**Decision**: Option 3 - Runtime detection via path inspection

**Rationale**:
- No external dependencies or configuration needed
- Works automatically in both contexts
- Simple and maintainable
- No risk of stale environment variables

**Trade-offs**:
- Assumes `.opencode/plugin/` naming convention won't change
- String matching is less robust than explicit configuration
- But: simplicity outweighs these concerns for this use case

---

## [2026-01-13] Decision: Complete Marketplace Schema in Template

**Context**: Generated marketplace.json was failing validation because it only included minimal fields.

**Options Considered**:
1. Generate minimal marketplace.json and let users fill in details
2. Include all required fields with placeholder values
3. Extract all fields from plugin manifest and populate fully

**Decision**: Option 3 - Extract and populate all fields from manifest

**Rationale**:
- Users already provided this information in plugin.json
- No manual work required after scaffolding
- Generated file passes validation immediately
- Follows principle of "zero configuration after scaffold"

**Trade-offs**:
- Requires plugin.json to have complete metadata
- But: this is already a requirement for Claude Code plugins

---

## [2026-01-13] Decision: Document Lessons in Spec Files

**Context**: Four bugs were discovered post-merge. Need to capture learnings for future features.

**Options Considered**:
1. Create separate post-mortem document
2. Update spec/plan/tasks files with "Post-Implementation" sections
3. Only update AGENTS.md with patterns
4. Record in .sisyphus/notepads/ only

**Decision**: Option 2 + 4 - Update spec files AND create notepad

**Rationale**:
- Spec files are the source of truth for the feature
- Future readers will see what went wrong and why
- Notepad provides session-level context for AI agents
- Both serve different purposes (human vs AI consumption)

**Trade-offs**:
- More documentation to maintain
- But: prevents repeating same mistakes in future features
