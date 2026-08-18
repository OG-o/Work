#!/usr/bin/env bash
# scripts/run-postmarketos.sh - Boots postmarketOS with KVM acceleration and web gateway
set -euo pipefail

VNC_PORT=5901
WEB_PORT=6080
LOG_DIR="$HOME/.vnc"
CLOUDFLARE_LOG="$LOG_DIR/cloudflared.log"

mkdir -p "$LOG_DIR"

echo "=========================================================="
echo "   📱  LAUNCHING GENUINE POSTMARKETOS (QEMU + KVM)        "
echo "=========================================================="

# 1. Stop existing desktop display server if running
tigervncserver -kill :1 >/dev/null 2>&1 || true
pkill -f "qemu-system-x86_64" 2>/dev/null || true
pkill -f "websockify.*${WEB_PORT}" 2>/dev/null || true
pkill -f "cloudflared.*${WEB_PORT}" 2>/dev/null || true

# 2. Launch postmarketOS in QEMU with KVM
echo "[*] Booting postmarketOS VM with KVM hardware acceleration..."
pmbootstrap qemu --display=vnc=:1 --kvm --image-size=4G > "$LOG_DIR/pmos-qemu.log" 2>&1 &
sleep 3

# 3. Start Websockify web gateway
echo "[*] Starting HTML5 Web Gateway on Port ${WEB_PORT}..."
websockify -D --web /usr/share/novnc ${WEB_PORT} localhost:${VNC_PORT} > "$LOG_DIR/novnc.log" 2>&1
sleep 1

# 4. Start Cloudflare Tunnel
echo "[*] Provisioning Global Cloud Gateway..."
nohup /usr/local/bin/cloudflared tunnel --edge-ip-version 4 --url "http://127.0.0.1:${WEB_PORT}" > "$CLOUDFLARE_LOG" 2>&1 < /dev/null &
disown

echo "[*] Waiting for tunnel..."
for i in {1..20}; do
  sleep 1
  PUBLIC_URL=$(grep -o "https://[a-zA-Z0-9.-]*\.trycloudflare\.com" "$CLOUDFLARE_LOG" | tail -n 1 || true)
  [ -n "$PUBLIC_URL" ] && break
done

echo ""
echo "=========================================================="
echo "🎉 POSTMARKETOS IS ACTIVE & BOOTED!"
echo ""
echo "👉 TAP THIS LINK TO OPEN POSTMARKETOS IN YOUR BROWSER:"
echo "   $PUBLIC_URL"
echo "=========================================================="
