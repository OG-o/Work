#!/usr/bin/env bash
set -euo pipefail

echo "========================================================"
echo "  Setting up Zero-Delay Linux Desktop PC for Codespaces "
echo "========================================================"

export DEBIAN_FRONTEND=noninteractive

# 1. Update and install packages
echo "[1/4] Installing XFCE4 desktop suite, utilities, and dependencies..."
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  xfce4 \
  xfce4-goodies \
  dbus-x11 \
  x11-xserver-utils \
  xterm \
  tigervnc-standalone-server \
  tigervnc-common \
  novnc \
  websockify \
  onboard \
  papirus-icon-theme \
  mousepad \
  geany \
  galculator \
  xfce4-screenshooter \
  file-roller \
  htop \
  qrencode \
  curl \
  wget \
  net-tools \
  libjpeg-turbo8 \
  libglib2.0-0 \
  libpixman-1-0 \
  libxfont2

# 2. Install KasmVNC (Ultra-Low Latency 60fps Web Engine)
echo "[2/4] Downloading & installing KasmVNC server..."
KASMVNC_DEB="/tmp/kasmvnc.deb"
wget -q "https://github.com/kasmtech/KasmVNC/releases/download/v1.5.0/kasmvncserver_noble_1.5.0_amd64.deb" -O "$KASMVNC_DEB"
sudo apt-get install -y "$KASMVNC_DEB" || sudo apt-get install -f -y
rm -f "$KASMVNC_DEB"

# Add current user to ssl-cert group if needed for kasmvnc
sudo usermod -aG ssl-cert "$USER" 2>/dev/null || true

# 3. Install Google Chrome
echo "[3/4] Downloading & installing Google Chrome..."
if ! command -v google-chrome &>/dev/null; then
  CHROME_DEB="/tmp/chrome.deb"
  wget -q "https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb" -O "$CHROME_DEB"
  sudo apt-get install -y "$CHROME_DEB" || sudo apt-get install -f -y
  rm -f "$CHROME_DEB"
fi

# 4. Setup VNC directories and permissions
echo "[4/4] Configuring VNC and Desktop Environment..."
mkdir -p "$HOME/.vnc"

cat << 'EOF' > "$HOME/.vnc/xstartup"
#!/usr/bin/env bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
export GTK_OVERLAY_SCROLLING=1
export GDK_BACKEND=x11

[ -x /etc/vnc/xstartup ] && exec /etc/vnc/xstartup
[ -r $HOME/.Xresources ] && xrdb $HOME/.Xresources

# Start D-Bus and XFCE4 Desktop
exec dbus-launch --exit-with-session startxfce4
EOF

chmod +x "$HOME/.vnc/xstartup"

echo "=== Base Installation Completed Successfully! ==="
