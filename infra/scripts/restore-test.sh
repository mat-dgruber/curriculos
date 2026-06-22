#!/bin/bash
# Valida que um dump do sqlite do jobhunter está íntegro.
# Uso: restore-test.sh [arquivo.db]
set -e
BACKUP_FILE=${1:-./backups/jobhunter_latest.db}
if [ ! -f "$BACKUP_FILE" ]; then
  echo "Backup não encontrado: $BACKUP_FILE" >&2
  exit 1
fi
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

echo "Resolving dependencies..."
uv pip install --quiet aiosqlite sqlalchemy 2>/dev/null || true

# Cria um banco efêmero e aplica o dump
sqlite3 "$WORK/test.db" < "$BACKUP_FILE"

python3 - <<PY
import sqlite3
conn = sqlite3.connect("$WORK/test.db")
cur = conn.cursor()
tables = [t[0] for t in cur.execute("SELECT name FROM sqlite_master WHERE type='table'")]
print(f"Tables: {tables}")
assert "jobs" in tables, "schema sem tabela jobs"
job_count = cur.execute("SELECT COUNT(*) FROM jobs").fetchone()[0]
print(f"jobs table: {job_count} rows")
assert job_count > 0, "tabela jobs vazia"
print("RESTORE OK")
PY
