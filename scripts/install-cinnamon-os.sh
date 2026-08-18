#!/usr/bin/env bash
set -euo pipefail

echo "=========================================================="
echo " Installing Modern Real Desktop OS with 0-Latency Engine  "
echo "=========================================================="

export DEBIAN_FRONTEND=noninteractive

# 1. Update and install Cinnamon Desktop + Modern Themes & Fonts
echo "[1/4] Installing Cinnamon 6.0 Desktop OS, Nemo, and Modern UI..."
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  cinnamon-core \
  nemo \
  gnome-terminal \
  yaru-theme-gtk \
  yaru-theme-icon \
  papirus-icon-theme \
  picom \
  fonts-inter \
  fonts-jetbrains-mono \
  fonts-roboto \
  libgl1-mesa-dri \
  mesa-utils

# 2. Configure VNC xstartup to launch Cinnamon Desktop
echo "[2/4] Configuring Cinnamon Session..."
cat << 'EOF' > "$HOME/.vnc/xstartup"
#!/usr/bin/env bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
export GTK_OVERLAY_SCROLLING=1
export GDK_BACKEND=x11
export XDG_CURRENT_DESKTOP="X-Cinnamon"
export XDG_SESSION_DESKTOP="cinnamon"
export CINNAMON_2D=1

[ -r $HOME/.Xresources ] && xrdb $HOME/.Xresources

# Start D-Bus and Cinnamon Desktop OS
exec dbus-launch --exit-with-session cinnamon-session
EOF
chmod +x "$HOME/.vnc/xstartup"

# 3. Configure KasmVNC 1.5.0 for 0-Latency Client Cursor & 60 FPS WebP Video
echo "[3/4] Configuring KasmVNC 60 FPS Video Engine..."
cat << 'EOF' > "$HOME/.vnc/kasmvnc.yaml"
desktop:
  resolution:
    width: 1920
    height: 1080
  allow_resize: true
  pixel_depth: 24

network:
  protocol: http
  interface: 0.0.0.0
  websocket_port: 8443
  use_ipv4: true
  use_ipv6: false
  ssl:
    pem_certificate: /home/codespace/.vnc/self.crt
    pem_key: /home/codespace/.vnc/self.key
    require_ssl: true

user_session:
  new_session_disconnects_existing_exclusive_session: true
  concurrent_connections_prompt: false
  idle_timeout: never

keyboard:
  raw_keyboard: false

pointer:
  enabled: true
  game_mode: false

logging:
  log_writer_name: all
  log_dest: logfile
  level: 30

security:
  brute_force_protection:
    blacklist_threshold: 10
    blacklist_timeout: 10

data_loss_prevention:
  clipboard:
    server_to_client:
      enabled: true
      size: unlimited
      primary_clipboard_enabled: true
    client_to_server:
      enabled: true
      size: unlimited
  keyboard:
    enabled: true
    rate_limit: unlimited

encoding:
  max_frame_rate: 60
  rect_encoding_mode:
    min_quality: 8
    max_quality: 9
    consider_lossless_quality: 10
    rectangle_compress_threads: 4
  video_encoding_mode:
    jpeg_quality: -1
    webp_quality: 9
    max_resolution:
      width: 1920
      height: 1080
    scaling_algorithm: progressive_bilinear
  video_streaming_mode:
    codec: auto

server:
  http:
    httpd_directory: /usr/share/kasmvnc/www
  advanced:
    kasm_password_file: /home/codespace/.kasmpasswd
  auto_shutdown:
    no_user_session_timeout: never
    active_user_session_timeout: never
    inactive_user_session_timeout: never

command_line:
  prompt: false
EOF

# 4. Copy modern desktop icons
mkdir -p "$HOME/Desktop"
cp /usr/share/applications/google-chrome.desktop "$HOME/Desktop/" 2>/dev/null || true
cp /usr/share/applications/nemo.desktop "$HOME/Desktop/" 2>/dev/null || true
cp /usr/share/applications/gnome-terminal.desktop "$HOME/Desktop/" 2>/dev/null || true
cp /usr/share/applications/onboard.desktop "$HOME/Desktop/" 2>/dev/null || true
cp /usr/share/applications/geany.desktop "$HOME/Desktop/" 2>/dev/null || true
chmod +x "$HOME/Desktop/"*.desktop 2>/dev/null || true

echo "=== Real Modern OS Installation & Configuration Completed! ==="
