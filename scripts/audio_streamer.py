#!/usr/bin/env python3
"""
Ultra-Low Latency PulseAudio Web Streamer & Mobile Window Manager API
Streams system audio from virtual_speaker.monitor over HTTP MP3 chunked stream on port 5711.
Provides /api/windows, /api/launch, /api/resolution, and /api/rdp endpoints.
"""

import os
import sys
import json
import subprocess
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import time

PORT = 5711
clients = set()
lock = threading.Lock()

APP_LAUNCH_COMMANDS = {
    "chrome": ["/usr/local/bin/google-chrome", "https://www.google.com"],
    "cursor": ["/usr/local/bin/cursor", "/workspaces/Work"],
    "code": ["/usr/local/bin/code", "/workspaces/Work"],
    "terminal": ["xfce4-terminal"],
    "thunar": ["thunar", "/workspaces/Work"],
    "gimp": ["gimp"],
    "mpv": ["mpv", "--player-operation-mode=pseudo-gui"],
    "abiword": ["abiword"],
    "gnumeric": ["gnumeric"],
    "synaptic": ["synaptic"],
    "baobab": ["baobab"],
    "calculator": ["galculator"],
    "settings": ["xfce4-settings-manager"],
    "bluestacks": ["/usr/local/bin/bluestacks"]
}

def get_x_env():
    env = os.environ.copy()
    env['DISPLAY'] = ':1'
    env['XAUTHORITY'] = '/home/codespace/.Xauthority'
    return env

def list_open_windows():
    try:
        out = subprocess.check_output(['wmctrl', '-l', '-G', '-x'], env=get_x_env(), text=True, timeout=2)
        ignored = ['xfce4-panel', 'xfdesktop', 'wrapper-2.0', 'xfce4-notifyd', 'desktop', 'keyboard']
        windows = []
        for line in out.strip().split('\n'):
            if not line:
                continue
            parts = line.split(None, 7)
            if len(parts) >= 8:
                wid, desk, x, y, w, h, wclass, title = parts
                if any(ign in wclass.lower() or ign in title.lower() for ign in ignored):
                    continue
                
                app_name = "Application"
                if "chrome" in wclass.lower():
                    app_name = "Google Chrome"
                elif "cursor" in wclass.lower():
                    app_name = "Cursor AI"
                elif "code" in wclass.lower():
                    app_name = "Visual Studio Code"
                elif "terminal" in wclass.lower():
                    app_name = "Ubuntu Terminal"
                elif "thunar" in wclass.lower():
                    app_name = "File Manager"
                elif "gimp" in wclass.lower():
                    app_name = "GIMP Studio"
                elif "mpv" in wclass.lower():
                    app_name = "MPV Media Player"
                elif "abiword" in wclass.lower():
                    app_name = "Word Editor (AbiWord)"
                elif "gnumeric" in wclass.lower():
                    app_name = "Excel Calc (Gnumeric)"
                elif "synaptic" in wclass.lower():
                    app_name = "Software Store"
                elif "baobab" in wclass.lower():
                    app_name = "Disk Usage"
                elif "galculator" in wclass.lower():
                    app_name = "Calculator"
                elif "bluestacks" in wclass.lower():
                    app_name = "BlueStacks"
                elif "geany" in wclass.lower():
                    app_name = "Geany Editor"
                else:
                    app_name = wclass.split('.')[0].capitalize()

                windows.append({
                    'id': wid,
                    'app': app_name,
                    'title': title.replace("codespaces-375574 ", "").strip(),
                    'class': wclass,
                    'x': int(x),
                    'y': int(y),
                    'w': int(w),
                    'h': int(h)
                })
        return windows
    except Exception as e:
        return []

def handle_window_action(wid, action):
    env = get_x_env()
    try:
        if action == "focus":
            subprocess.run(['wmctrl', '-i', '-a', wid], env=env, timeout=2)
        elif action == "maximize":
            subprocess.run(['wmctrl', '-i', '-r', wid, '-b', 'add,maximized_vert,maximized_horz'], env=env, timeout=2)
            subprocess.run(['wmctrl', '-i', '-a', wid], env=env, timeout=2)
        elif action == "center":
            subprocess.run(['wmctrl', '-i', '-r', wid, '-b', 'remove,maximized_vert,maximized_horz'], env=env, timeout=2)
            subprocess.run(['wmctrl', '-i', '-r', wid, '-e', '0,10,40,700,500'], env=env, timeout=2)
            subprocess.run(['wmctrl', '-i', '-a', wid], env=env, timeout=2)
        elif action == "close":
            subprocess.run(['wmctrl', '-i', '-c', wid], env=env, timeout=2)
        return True
    except Exception:
        return False

def launch_app(app_key):
    cmd = APP_LAUNCH_COMMANDS.get(app_key)
    if not cmd:
        return False
    try:
        subprocess.Popen(cmd, env=get_x_env(), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        return True
    except Exception:
        return False

def set_resolution(res_str):
    try:
        subprocess.run(['xrandr', '-s', res_str], env=get_x_env(), timeout=2)
        return True
    except Exception:
        return False

def get_rdp_info():
    addr = "Not available"
    try:
        if os.path.exists("/home/codespace/.vnc/rdp_public_address.txt"):
            with open("/home/codespace/.vnc/rdp_public_address.txt", "r") as f:
                addr = f.read().strip()
    except Exception:
        pass
    
    parts = addr.split(":")
    host = parts[0] if len(parts) > 0 else "localhost"
    port = parts[1] if len(parts) > 1 else "3389"
    return {
        "status": "ok",
        "address": addr,
        "host": host,
        "port": port,
        "username": "codespace",
        "password": "codespace",
        "download_url": "/cloudpc.rdp"
    }

class UnifiedServerHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ["/", "/audio.mp3", "/stream"]:
            self.send_response(200)
            self.send_header("Content-Type", "audio/mpeg")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", "0")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Connection", "keep-alive")
            self.end_headers()

            cmd = [
                "ffmpeg",
                "-nostats",
                "-loglevel", "error",
                "-f", "pulse",
                "-i", "virtual_speaker.monitor",
                "-c:a", "libmp3lame",
                "-b:a", "128k",
                "-flush_packets", "1",
                "-f", "mp3",
                "-"
            ]
            proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, bufsize=1024)
            with lock:
                clients.add(proc)

            try:
                while True:
                    data = proc.stdout.read(1024)
                    if not data:
                        break
                    self.wfile.write(data)
                    self.wfile.flush()
            except (ConnectionResetError, BrokenPipeError):
                pass
            finally:
                with lock:
                    if proc in clients:
                        clients.remove(proc)
                proc.terminate()
                try:
                    proc.wait(timeout=1)
                except subprocess.TimeoutExpired:
                    proc.kill()
        elif self.path.startswith("/api/windows"):
            windows = list_open_windows()
            data = json.dumps({"status": "ok", "count": len(windows), "windows": windows}).encode('utf-8')
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(data)
        elif self.path.startswith("/api/rdp"):
            rdp_info = get_rdp_info()
            data = json.dumps(rdp_info).encode('utf-8')
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            self.wfile.write(data)
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path.startswith("/api/windows/action"):
            content_len = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_len)
            try:
                req = json.loads(post_body.decode('utf-8'))
                wid = req.get('id')
                action = req.get('action', 'focus')
                success = handle_window_action(wid, action)
                resp = json.dumps({"status": "ok" if success else "error"}).encode('utf-8')
            except Exception as e:
                resp = json.dumps({"status": "error", "message": str(e)}).encode('utf-8')
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(resp)
        elif self.path.startswith("/api/launch"):
            content_len = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_len)
            try:
                req = json.loads(post_body.decode('utf-8'))
                app_key = req.get('app', '')
                success = launch_app(app_key)
                resp = json.dumps({"status": "ok" if success else "error", "app": app_key}).encode('utf-8')
            except Exception as e:
                resp = json.dumps({"status": "error", "message": str(e)}).encode('utf-8')
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(resp)
        elif self.path.startswith("/api/resolution"):
            content_len = int(self.headers.get('Content-Length', 0))
            post_body = self.rfile.read(content_len)
            try:
                req = json.loads(post_body.decode('utf-8'))
                res_str = req.get('resolution', '1920x1080')
                success = set_resolution(res_str)
                resp = json.dumps({"status": "ok" if success else "error", "resolution": res_str}).encode('utf-8')
            except Exception as e:
                resp = json.dumps({"status": "error", "message": str(e)}).encode('utf-8')
            
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(resp)
        else:
            self.send_response(404)
            self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        pass

def run_server():
    server = HTTPServer(("0.0.0.0", PORT), UnifiedServerHandler)
    print(f"🔊 Live Audio, Window Manager & RDP API listening on http://0.0.0.0:{PORT}")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
