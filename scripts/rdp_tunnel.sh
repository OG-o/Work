#!/bin/bash
# 24/7 Auto-Reconnecting Public RDP TCP Tunnel
LOG_FILE="/home/codespace/.vnc/rdp_tunnel.log"
URL_FILE="/home/codespace/.vnc/rdp_url.txt"
mkdir -p /home/codespace/.vnc

while true; do
    echo "[$(date)] Starting Public RDP TCP Tunnel on port 3389..." >> "$LOG_FILE"
    ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -p 443 -R0:localhost:3389 tcp@a.pinggy.io 2>&1 | while read -r line; do
        echo "$line" >> "$LOG_FILE"
        if [[ "$line" =~ tcp://([a-zA-Z0-9.-]+:[0-9]+) ]]; then
            echo "${BASH_REMATCH[1]}" > "$URL_FILE"
            echo "[$(date)] Public RDP Address: ${BASH_REMATCH[1]}" >> "$LOG_FILE"
        fi
    done
    sleep 3
done
