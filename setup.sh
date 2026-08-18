#!/usr/bin/env bash
# ==============================================================================
# 🚀 Ubuntu 24.04 Cloud PC - 1-Click Universal Installer
# Automatically configures a high-performance, mobile-optimized desktop PC
# with audio streaming, VS Code, Google Chrome, and instant phone keyboard.
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
echo -e "${YELLOW}[1/8] Installing desktop environment and core dependencies...${NC}"
sudo apt-get update -qq
sudo apt-get install -y --no-install-recommends \
    tigervnc-standalone-server \
    tigervnc-common \
    xfce4 \
    xfce4-goodies \
    xfce4-terminal \
    thunar \
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
    curl \
    wget \
    git \
    unzip \
    ca-certificates \
    gnupg

# 2. Install Google Chrome with Container Sandbox Flags
echo -e "${YELLOW}[2/8] Setting up Google Chrome with container software rasterization...${NC}"
if ! command -v google-chrome &> /dev/null; then
    wget -q -O /tmp/chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb || true
    sudo apt-get install -y /tmp/chrome.deb || true
    rm -f /tmp/chrome.deb
fi

# Create robust container wrapper for Chrome
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

# 3. Install Microsoft Visual Studio Code
echo -e "${YELLOW}[3/8] Setting up Visual Studio Code Desktop App...${NC}"
if ! command -v code &> /dev/null; then
    wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor | sudo tee /usr/share/keyrings/packages.microsoft.gpg > /dev/null
    echo "deb [arch=amd64,arm64,armhf signed-by=/usr/share/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list > /dev/null
    sudo apt-get update -qq
    sudo apt-get install -y code
fi

# Create robust container wrapper for VS Code
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

# 4. Install Cloudflare Tunnel (cloudflared)
echo -e "${YELLOW}[4/8] Setting up Cloudflare Tunnel...${NC}"
if ! command -v cloudflared &> /dev/null; then
    wget -q -O /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i /tmp/cloudflared.deb || true
    rm -f /tmp/cloudflared.deb
fi

# 5. Configure Desktop Environment & Shortcuts
echo -e "${YELLOW}[5/8] Configuring desktop shortcuts and launchers...${NC}"
mkdir -p /home/codespace/.vnc /home/codespace/Desktop
cp "$SCRIPT_DIR/config/xstartup" /home/codespace/.vnc/xstartup
chmod +x /home/codespace/.vnc/xstartup

# Antigravity IDE Launcher
cat << 'EOF' | sudo tee /usr/local/bin/antigravity-ide > /dev/null
#!/bin/bash
export AGY_ENABLE_AGENT=1
export ANTIGRAVITY_IDE=1
exec /usr/local/bin/code --new-window /workspaces/Work "$@"
EOF
sudo chmod +x /usr/local/bin/antigravity-ide

# BlueStacks Launcher
cat << 'EOF' | sudo tee /usr/local/bin/bluestacks > /dev/null
#!/bin/bash
exec /usr/local/bin/google-chrome --app="https://now.gg" --window-size=960,640 "$@"
EOF
sudo chmod +x /usr/local/bin/bluestacks

# Desktop Wallpaper Shortcuts
cat << 'EOF' > "/home/codespace/Desktop/Antigravity IDE.desktop"
[Desktop Entry]
Name=Antigravity IDE
Exec=/usr/local/bin/antigravity-ide
Icon=vscode
Type=Application
Categories=Development;IDE;
EOF

cat << 'EOF' > "/home/codespace/Desktop/Visual Studio Code.desktop"
[Desktop Entry]
Name=Visual Studio Code
Exec=/usr/local/bin/code %F
Icon=vscode
Type=Application
Categories=Development;IDE;
EOF

cat << 'EOF' > "/home/codespace/Desktop/BlueStacks.desktop"
[Desktop Entry]
Name=BlueStacks Android Player
Exec=/usr/local/bin/bluestacks
Icon=gamepad
Type=Application
Categories=Game;Emulator;
EOF

cp /usr/share/applications/google-chrome.desktop /home/codespace/Desktop/ 2>/dev/null || true
cp /usr/share/applications/xfce4-terminal.desktop /home/codespace/Desktop/ 2>/dev/null || true
chmod +x /home/codespace/Desktop/*.desktop 2>/dev/null || true
gio set /home/codespace/Desktop/*.desktop metadata::trusted true 2>/dev/null || true

# 6. Configure Nginx Unified Gateway & Mobile Enhancements
echo -e "${YELLOW}[6/8] Configuring Nginx unified gateway (Video + Audio + Mobile Toolbar)...${NC}"
sudo cp "$SCRIPT_DIR/config/nginx.conf" /etc/nginx/sites-available/default
sudo cp "$SCRIPT_DIR/config/manifest.json" /usr/share/novnc/manifest.json
sudo cp "$SCRIPT_DIR/config/mobile-helper.js" /usr/share/novnc/mobile-helper.js

# Inject helper scripts into noVNC
sudo sed -i 's|<head>|<head>\n    <link rel="manifest" href="manifest.json">|' /usr/share/novnc/vnc.html 2>/dev/null || true
sudo sed -i 's|</head>|    <script src="mobile-helper.js"></script>\n</head>|' /usr/share/novnc/vnc.html 2>/dev/null || true

# Redirect index.html directly to mobile vnc with autoconnect
cat << 'EOF' | sudo tee /usr/share/novnc/index.html > /dev/null
<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="refresh" content="0; url='vnc.html?autoconnect=true&resize=remote&reconnect=true&path=websockify'">
</head>
<body>
    <p>Redirecting to Ubuntu Cloud PC...</p>
</body>
</html>
EOF

# 7. Install CLI Controller
echo -e "${YELLOW}[7/8] Installing cloudpc CLI controller...${NC}"
sudo cp "$SCRIPT_DIR/bin/cloudpc" /usr/local/bin/cloudpc
sudo chmod +x /usr/local/bin/cloudpc
sudo chmod +x "$SCRIPT_DIR/scripts/daily-pc-service"
sudo chmod +x "$SCRIPT_DIR/scripts/audio_streamer.py"

# 8. Start All Services & Watchdog
echo -e "${YELLOW}[8/8] Starting Cloud PC 24/7 Watchdog Daemon...${NC}"
cloudpc start

echo -e "${GREEN}${BOLD}"
echo "================================================================"
echo "    ✔ Ubuntu 24.04 Cloud PC Installation Completed Successfully! "
echo "================================================================"
echo -e "${NC}"
cloudpc status
