# Decisions — unified-distribution-hub

## [2026-03-11] Session Start

### Architecture Decisions
- `generateRegistry()` accepts `LoadedSkill[]` (not `SkillArtifact[]`) to get descriptions from `skill.description`
- Component file paths: `platforms/opencode/output/skills/{name}/SKILL.md` and `platforms/opencode/output/skills/{name}/mcp.json`
- Registry metadata: name="phil-ai", version="1.0.0", author="pjbeyer"
- JSONC = plain JSON (no comments needed) — `JSON.stringify` output is valid JSONC
- Inline Zod schemas in validate command (no extraction to shared)
- `detectValidationType()` checks `registry.jsonc` BEFORE `.json` catch-all
