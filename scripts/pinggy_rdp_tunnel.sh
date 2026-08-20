#!/usr/bin/env bash
# ==============================================================================
# Pinggy High-Performance RDP Tunnel Manager (Port 443 Outbound)
# Establishes an encrypted raw TCP tunnel to XRDP (Port 3389) via Pinggy.
# ==============================================================================

set -euo pipefail

LOG_FILE="/home/codespace/.vnc/pinggy_rdp.log"
mkdir -p "/home/codespace/.vnc"

echo "========================================================"
echo "   🖥️ Starting Microsoft Remote Desktop (RDP) Tunnel    "
echo "========================================================"

# Check if XRDP is running
if ! pgrep -f "/usr/sbin/xrdp" > /dev/null; then
    echo "⚙️ Starting XRDP service..."
    sudo service xrdp restart
fi

# Stop existing pinggy RDP instances
pkill -f "ssh.*tcp@a.pinggy.io" 2>/dev/null || true

echo "🌐 Connecting to Pinggy TCP Edge on Port 443..."
nohup ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=10 -o ServerAliveCountMax=3 \
    -p 443 -R0:localhost:3389 tcp@a.pinggy.io > "$LOG_FILE" 2>&1 &

# Wait for tunnel initialization
sleep 3

# Parse the allocated address
ENDPOINT=$(grep -oE "tcp://[a-zA-Z0-9\-\.]+\.pinggy[a-zA-Z0-9\-\.]*:[0-9]+" "$LOG_FILE" | head -n 1 | sed 's|tcp://||' || true)

if [ -n "$ENDPOINT" ]; then
    echo ""
    echo "🎉 RDP TUNNEL READY!"
    echo "--------------------------------------------------------"
    echo "👉 PC Name / Host:  $ENDPOINT"
    echo "👉 Username:        codespace"
    echo "👉 Password:        codespace"
    echo "👉 Protocol:        RDP (TLS 1.3 / FastPath)"
    echo "--------------------------------------------------------"
    echo "Open Microsoft Remote Desktop, enter the PC Name above, and tap Connect!"
    echo "========================================================"
else
    echo "⚠️ Tunnel starting... check logs with: cat $LOG_FILE"
fi
