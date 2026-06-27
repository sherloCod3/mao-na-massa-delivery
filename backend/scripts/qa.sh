#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────
# QA Script — Mão na Massa Backend
# Uso:  ./scripts/qa.sh [--fix]
# ──────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
FAIL=0

echo -e "${YELLOW}╔══════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║        Mão na Massa — QA Check          ║${NC}"
echo -e "${YELLOW}╚══════════════════════════════════════════╝${NC}"
echo ""

# ─── 1. Ruff Lint ──────────────────────────────────────────
echo -e "${YELLOW}[1/5] Ruff Lint...${NC}"
if [ "${1:-}" = "--fix" ]; then
  uv run ruff check app/ scripts/ --fix
else
  uv run ruff check app/ scripts/
fi
if [ $? -eq 0 ]; then
  echo -e "${GREEN}  ✅ Ruff lint passed${NC}"
else
  echo -e "${RED}  ❌ Ruff lint failed${NC}"
  FAIL=1
fi
echo ""

# ─── 2. Ruff Format Check ──────────────────────────────────
echo -e "${YELLOW}[2/5] Ruff Format...${NC}"
if [ "${1:-}" = "--fix" ]; then
  uv run ruff format app/ scripts/
else
  uv run ruff format --check app/ scripts/
fi
if [ $? -eq 0 ]; then
  echo -e "${GREEN}  ✅ Ruff format passed${NC}"
else
  echo -e "${RED}  ❌ Ruff format failed (run with --fix to auto-format)${NC}"
  FAIL=1
fi
echo ""

# ─── 3. Bandit Security ────────────────────────────────────
echo -e "${YELLOW}[3/5] Bandit Security...${NC}"
uv run bandit -c pyproject.toml -r app/
if [ $? -eq 0 ]; then
  echo -e "${GREEN}  ✅ Bandit passed${NC}"
else
  echo -e "${RED}  ❌ Bandit found issues${NC}"
  FAIL=1
fi
echo ""

# ─── 4. Pylint ─────────────────────────────────────────────
echo -e "${YELLOW}[4/5] Pylint...${NC}"
uv run pylint app/ --exit-zero || true
# Pylint exit-zero because we use Ruff for style — Pylint is advisory
echo -e "${GREEN}  ✅ Pylint done (advisory only)${NC}"
echo ""

# ─── 5. Tests ──────────────────────────────────────────────
echo -e "${YELLOW}[5/5] Pytest...${NC}"
uv run python -m pytest tests/ -v --tb=short -q
TEST_EXIT=$?
if [ $TEST_EXIT -eq 0 ]; then
  echo -e "${GREEN}  ✅ All tests passed${NC}"
else
  echo -e "${RED}  ❌ Tests failed${NC}"
  FAIL=1
fi
echo ""

# ─── Summary ────────────────────────────────────────────────
echo -e "${YELLOW}╔══════════════════════════════════════════╗${NC}"
if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}║      ✅ All QA checks passed!            ║${NC}"
else
  echo -e "${RED}║      ❌ Some checks failed                 ║${NC}"
fi
echo -e "${YELLOW}╚══════════════════════════════════════════╝${NC}"
exit $FAIL
