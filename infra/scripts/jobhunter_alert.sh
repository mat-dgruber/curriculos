#!/bin/bash
# Dispara webhook quando mem pct >threshold por N snapshots consecutivos.
# Lê do log produzido por jobhunter_mem_monitor.sh.
LOG=/var/log/jobhunter-monitor.log
WEBHOOK_URL="${ALERT_WEBHOOK_URL:-}"   # Discord/Slack/Telegram
PCT_THRESHOLD=85
N_CONSEC=3

if [ ! -f "$LOG" ]; then
  exit 0
fi

# Extrai a lista de pct dos últimos N snapshots (uma linha por sample).
samples=$(tail -n $N_CONSEC "$LOG" | grep -oE 'pct=[0-9.]+' | cut -d= -f2)
if [ -z "$samples" ]; then
  exit 0
fi

# Conta quantos snapshots existem de fato (≤ N_CONSEC).
sample_count=$(echo "$samples" | wc -l | tr -d ' ')
if [ "$sample_count" -lt "$N_CONSEC" ]; then
  exit 0
fi

# Exige que TODOS os últimos N estejam >= threshold.
above=$(echo "$samples" | awk -v t="$PCT_THRESHOLD" '{ c += ($1+0 >= t) } END { print c+0 }')
if [ "$above" = "$N_CONSEC" ] && [ -n "$WEBHOOK_URL" ]; then
  max=$(echo "$samples" | sort -g | tail -1)
  curl -fsS -X POST -H "Content-Type: application/json" \
    -d "{\"content\":\"jobhunter mem pct>=$PCT_THRESHOLD (max=$max) por $N_CONSEC snapshots\"}" \
    "$WEBHOOK_URL" || true
fi
