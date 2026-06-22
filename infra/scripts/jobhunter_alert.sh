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

last_n=$(tail -n $N_CONSEC "$LOG" | grep -oE 'pct=[0-9.]+' | tail -1 | cut -d= -f2)
if [ -z "$last_n" ]; then
  exit 0
fi

# bc nem sempre está disponível; aceitar erro silencioso
above=$(echo "$last_n >= $PCT_THRESHOLD" | bc -l 2>/dev/null || echo 0)
if [ "$above" = "1" ] && [ -n "$WEBHOOK_URL" ]; then
  curl -fsS -X POST -H "Content-Type: application/json" \
    -d "{\"content\":\"jobhunter mem pct=$last_n >= $PCT_THRESHOLD\"}" \
    "$WEBHOOK_URL" || true
fi
