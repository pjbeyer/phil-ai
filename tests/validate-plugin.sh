#!/usr/bin/env bash
set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0
CHECKS=0

pass() { ((CHECKS++)); echo -e "  ${GREEN}✓${NC} $1"; }
fail() { ((ERRORS++)); ((CHECKS++)); echo -e "  ${RED}✗${NC} $1"; }
warn() { ((WARNINGS++)); echo -e "  ${YELLOW}!${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_ROOT/platforms/opencode/output"
CORE_SKILLS_DIR="$PROJECT_ROOT/core/skills"

# Expected core skills
SKILLS=("learning" "docs" "context" "workflow" "guide")

echo "=== OpenCode Plugin Validation ==="
echo ""

# ── Section 1: Production Output ──
echo "── Production Output ($OUTPUT_DIR) ──"

# Check output directory exists
if [ ! -d "$OUTPUT_DIR" ]; then
  fail "Output directory does not exist: $OUTPUT_DIR"
  echo ""
  echo "Run 'bun run platforms/opencode/generator/index.ts' first."
  exit 1
fi

# Check package.json
if [ -f "$OUTPUT_DIR/package.json" ]; then
  pass "package.json exists"
  
  # Check it has @opencode-ai/plugin dependency
  if grep -q '"@opencode-ai/plugin"' "$OUTPUT_DIR/package.json"; then
    pass "package.json has @opencode-ai/plugin dependency"
  else
    fail "package.json missing @opencode-ai/plugin dependency"
  fi
  
  # Check name
  if grep -q '"@phil-ai/opencode-plugin"' "$OUTPUT_DIR/package.json"; then
    pass "package.json has correct name"
  else
    fail "package.json has wrong name (expected @phil-ai/opencode-plugin)"
  fi
  
  # Check type: module
  if grep -q '"type": "module"' "$OUTPUT_DIR/package.json"; then
    pass "package.json has type: module"
  else
    fail "package.json missing type: module"
  fi
else
  fail "package.json does not exist"
fi

# Check Plugin entry point
if [ -f "$OUTPUT_DIR/src/index.ts" ]; then
  pass "src/index.ts exists"
  
  # Check it imports Plugin type
  if grep -q '@opencode-ai/plugin' "$OUTPUT_DIR/src/index.ts"; then
    pass "src/index.ts imports @opencode-ai/plugin"
  else
    fail "src/index.ts does not import @opencode-ai/plugin"
  fi
  
  # Check it has default export
  if grep -q 'export default' "$OUTPUT_DIR/src/index.ts"; then
    pass "src/index.ts has default export"
  else
    fail "src/index.ts missing default export"
  fi
else
  fail "src/index.ts does not exist"
fi

# Check each core skill has generated output
echo ""
echo "── Skill Directories ──"
for skill in "${SKILLS[@]}"; do
  skill_dir="$OUTPUT_DIR/skills/$skill"
  
  if [ ! -d "$skill_dir" ]; then
    fail "Missing skill directory: skills/$skill/"
    continue
  fi
  pass "skills/$skill/ exists"
  
  # Check SKILL.md
  if [ -f "$skill_dir/SKILL.md" ]; then
    pass "skills/$skill/SKILL.md exists"
    
    # Check YAML frontmatter
    if head -1 "$skill_dir/SKILL.md" | grep -q '^---'; then
      pass "skills/$skill/SKILL.md has YAML frontmatter"
      
      # Check name field in frontmatter
      if sed -n '/^---$/,/^---$/p' "$skill_dir/SKILL.md" | grep -q "^name: $skill"; then
        pass "skills/$skill/SKILL.md frontmatter has correct name"
      else
        fail "skills/$skill/SKILL.md frontmatter has wrong name (expected: $skill)"
      fi
      
      # Check description field
      if sed -n '/^---$/,/^---$/p' "$skill_dir/SKILL.md" | grep -q "^description:"; then
        pass "skills/$skill/SKILL.md frontmatter has description"
      else
        fail "skills/$skill/SKILL.md frontmatter missing description"
      fi
    else
      fail "skills/$skill/SKILL.md missing YAML frontmatter"
    fi
  else
    fail "skills/$skill/SKILL.md does not exist"
  fi
  
  # Check mcp.json
  if [ -f "$skill_dir/mcp.json" ]; then
    pass "skills/$skill/mcp.json exists"
    
    # Check mcpServers key
    if grep -q '"mcpServers"' "$skill_dir/mcp.json"; then
      pass "skills/$skill/mcp.json has mcpServers key"
    else
      fail "skills/$skill/mcp.json missing mcpServers key"
    fi
    
    # Check valid JSON
    if bun -e "JSON.parse(require('fs').readFileSync('$skill_dir/mcp.json','utf-8'))" 2>/dev/null; then
      pass "skills/$skill/mcp.json is valid JSON"
    else
      fail "skills/$skill/mcp.json is not valid JSON"
    fi
  else
    fail "skills/$skill/mcp.json does not exist"
  fi
done

# ── Section 2: Credential Safety ──
echo ""
echo "── Credential Safety ──"
# No hardcoded paths or secrets
if grep -rn '/Users/' "$OUTPUT_DIR" --include='*.ts' --include='*.json' 2>/dev/null | grep -v node_modules; then
  fail "Output contains hardcoded absolute paths"
else
  pass "No hardcoded absolute paths"
fi

if grep -rn 'API_KEY\|SECRET\|PASSWORD\|TOKEN' "$OUTPUT_DIR" --include='*.ts' --include='*.json' 2>/dev/null | grep -v 'description\|comment\|//' | grep -v node_modules; then
  warn "Output may contain credential references"
else
  pass "No credential leaks detected"
fi

# ── Section 3: Core Skill Source Consistency ──
echo ""
echo "── Source Consistency ──"
for skill in "${SKILLS[@]}"; do
  if [ -f "$CORE_SKILLS_DIR/$skill/skill.json" ]; then
    pass "Core skill source exists: core/skills/$skill/skill.json"
  else
    fail "Missing core skill source: core/skills/$skill/skill.json"
  fi
  
  if [ -f "$CORE_SKILLS_DIR/$skill/SKILL.md" ]; then
    pass "Core skill docs exists: core/skills/$skill/SKILL.md"
  else
    fail "Missing core skill docs: core/skills/$skill/SKILL.md"
  fi
done

# ── Summary ──
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Checks: $CHECKS | Passed: $((CHECKS - ERRORS)) | Failed: $ERRORS | Warnings: $WARNINGS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $ERRORS -gt 0 ]; then
  echo -e "  ${RED}VALIDATION FAILED${NC}"
  exit 1
else
  echo -e "  ${GREEN}ALL CHECKS PASSED${NC}"
  exit 0
fi
