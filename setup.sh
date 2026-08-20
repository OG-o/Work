#!/usr/bin/env bash
# ==============================================================================
# 🚀 Ubuntu 24.04 Cloud PC - 1-Click Universal Workstation Installer
# Automatically configures a high-performance, mobile & RDP-optimized desktop PC
# with live audio streaming, VS Code, Chrome, Claude Code, Facebook, and Pinggy RDP.
# ==============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "================================================================"
echo "    🚀 Installing Ubuntu 24.04 Cloud PC Workstation Suite      "
echo "================================================================"
echo -e "${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export DEBIAN_FRONTEND=noninteractive

# 1. Update and install core desktop & utility packages
echo -e "${YELLOW}[1/8] Installing desktop environment, XRDP, and dependencies...${NC}"
sudo apt-get update -qq
sudo apt-get install -y --no-install-recommends \
    tigervnc-standalone-server \
    tigervnc-common \
    xfce4 \
    xfce4-goodies \
    xfce4-terminal \
    thunar \
    xrdp \
    xorgxrdp \
    dbus-x11 \
    x11-xserver-utils \
    pulseaudio \
    pulseaudio-utils \
    pavucontrol \
    ffmpeg \
    lame \
    nginx \
    novnc \
    websockify \
    papirus-icon-theme \
    geany \
    evince \
    ristretto \
    galculator \
    htop \
    xdotool \
    wmctrl \
    matchbox-keyboard \
    wine \
    winetricks \
    cabextract \
    mpv \
    gimp \
    abiword \
    gnumeric \
    synaptic \
    gdebi-core \
    baobab \
    tmux \
    neovim \
    curl \
    wget \
    git \
    unzip \
    ca-certificates \
    gnupg

# 2. Install Claude Code & Developer AI Tools
echo -e "${YELLOW}[2/8] Setting up Claude Code AI Assistant...${NC}"
sudo npm install -g @anthropic-ai/claude-code 2>/dev/null || true

# 3. Install Real Facebook Desktop App (Caprine)
echo -e "${YELLOW}[3/8] Setting up Facebook Native Desktop App...${NC}"
if ! command -v caprine &> /dev/null; then
    curl -sL https://github.com/sindresorhus/caprine/releases/download/v2.61.0/caprine_2.61.0_amd64.deb -o /tmp/caprine.deb || true
    sudo apt-get install -y /tmp/caprine.deb 2>/dev/null || sudo dpkg -i /tmp/caprine.deb || true
    rm -f /tmp/caprine.deb
fi

# 4. Install Google Chrome with Container Sandbox Flags
echo -e "${YELLOW}[4/8] Setting up Google Chrome with container software rasterization...${NC}"
if ! command -v google-chrome &> /dev/null; then
    wget -q -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb || true
    sudo apt-get install -y /tmp/chrome.deb || true
    rm -f /tmp/chrome.deb
fi

cat << 'EOF' | sudo tee /usr/local/bin/google-chrome > /dev/null
#!/bin/bash
exec /opt/google/chrome/google-chrome \
  --no-sandbox \
  --disable-setuid-sandbox \
  --disable-dev-shm-usage \
  --disable-gpu \
  --disable-software-rasterizer \
  --no-zygote \
  --disable-features=IsolateOrigins,site-per-process,AudioServiceOutOfProcess \
  --ozone-platform=x11 \
  "$@"
EOF
sudo chmod +x /usr/local/bin/google-chrome
sudo ln -sf /usr/local/bin/google-chrome /usr/local/bin/google-chrome-stable

# 5. Install Visual Studio Code & Cursor AI
echo -e "${YELLOW}[5/8] Setting up Visual Studio Code Desktop App...${NC}"
if ! command -v code &> /dev/null; then
    wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor | sudo tee /usr/share/keyrings/packages.microsoft.gpg > /dev/null
    echo "deb [arch=amd64,arm64,armhf signed-by=/usr/share/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list > /dev/null
    sudo apt-get update -qq
    sudo apt-get install -y code
fi

cat << 'EOF' | sudo tee /usr/local/bin/code > /dev/null
#!/bin/bash
exec /usr/share/code/code \
  --no-sandbox \
  --disable-gpu \
  --disable-dev-shm-usage \
  --disable-software-rasterizer=false \
  --ozone-platform=x11 \
  "$@"
EOF
sudo chmod +x /usr/local/bin/code

# 6. Install Cloudflare Tunnel (cloudflared)
echo -e "${YELLOW}[6/8] Setting up Cloudflare Public Edge Tunnel...${NC}"
if ! command -v cloudflared &> /dev/null; then
    wget -q -O /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i /tmp/cloudflared.deb || true
    rm -f /tmp/cloudflared.deb
fi

# 7. Configure Desktop Environment, XRDP, & Launchers
echo -e "${YELLOW}[7/8] Configuring desktop shortcuts, XRDP 4MB buffers, and Nginx...${NC}"
mkdir -p /home/codespace/.vnc /home/codespace/Desktop

# XRDP Fastpath & Socket buffer tuning
sudo sed -i 's/^autorun=.*/autorun=Xorg/' /etc/xrdp/xrdp.ini 2>/dev/null || true
sudo sed -i 's/^#hidelogwindow=true/hidelogwindow=true/' /etc/xrdp/xrdp.ini 2>/dev/null || true
sudo sed -i 's/#tcp_send_buffer_bytes=32768/tcp_send_buffer_bytes=4194304/' /etc/xrdp/xrdp.ini 2>/dev/null || true
sudo sed -i 's/#tcp_recv_buffer_bytes=32768/tcp_recv_buffer_bytes=4194304/' /etc/xrdp/xrdp.ini 2>/dev/null || true

# Nginx Gateway
sudo cp "$SCRIPT_DIR/config/nginx.conf" /etc/nginx/sites-available/default
sudo service nginx reload 2>/dev/null || sudo service nginx start 2>/dev/null || true

# 8. Install CLI Controller & Launch Services
echo -e "${YELLOW}[8/8] Installing cloudpc CLI and launching 24/7 watchdog...${NC}"
sudo cp "$SCRIPT_DIR/bin/cloudpc" /usr/local/bin/cloudpc
sudo chmod +x /usr/local/bin/cloudpc
sudo chmod +x "$SCRIPT_DIR/scripts/daily-pc-service"
sudo chmod +x "$SCRIPT_DIR/scripts/audio_streamer.py"
sudo chmod +x "$SCRIPT_DIR/scripts/pinggy_rdp_tunnel.sh"
sudo chmod +x "$SCRIPT_DIR/scripts/system_health_check.py"

cloudpc start

echo -e "${GREEN}${BOLD}"
echo "================================================================"
echo "    ✔ Ubuntu 24.04 Cloud PC Installation Completed Successfully! "
echo "================================================================"
echo -e "${NC}"
cloudpc status
