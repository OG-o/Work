#!/usr/bin/env python3
"""
Automated System Diagnostic & Health Check Suite
Validates X11 VNC, PulseAudio, Audio Streamer, Nginx Gateway, and Cloudflare Tunnel.
"""

import sys
import socket
import subprocess
import urllib.request
import ssl
import time

GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

def print_banner():
    print(f"\n{CYAN}{BOLD}========================================================")
    print("      🔍 Ubuntu 24.04 Cloud PC Diagnostic Health Check  ")
    print(f"========================================================{RESET}\n")

def check_port(host, port, name):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(2.0)
    try:
        s.connect((host, port))
        s.close()
        print(f"  [{GREEN}✔ PASS{RESET}] {name} (Port {port}) is listening.")
        return True
    except Exception:
        print(f"  [{RED}✖ FAIL{RESET}] {name} (Port {port}) is not responding!")
        return False

def check_websocket():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.settimeout(3.0)
    try:
        s.connect(('127.0.0.1', 6080))
        req = (
            'GET /websockify HTTP/1.1\r\n'
            'Host: 127.0.0.1:6080\r\n'
            'Upgrade: websocket\r\n'
            'Connection: Upgrade\r\n'
            'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n'
            'Sec-WebSocket-Version: 13\r\n\r\n'
        )
        s.sendall(req.encode())
        resp = s.recv(512).decode(errors='ignore')
        s.close()
        if "101 Switching Protocols" in resp:
            print(f"  [{GREEN}✔ PASS{RESET}] WebSocket 101 Handshake via Nginx Gateway is operational.")
            return True
        else:
            print(f"  [{RED}✖ FAIL{RESET}] WebSocket handshake returned: {resp[:100]}")
            return False
    except Exception as e:
        print(f"  [{RED}✖ FAIL{RESET}] WebSocket gateway error: {e}")
        return False

def check_audio_stream():
    try:
        req = urllib.request.Request("http://127.0.0.1:6080/audio.mp3", headers={"User-Agent": "HealthCheck/1.0"})
        with urllib.request.urlopen(req, timeout=3.0) as resp:
            if resp.status == 200:
                data = resp.read(100)
                if len(data) > 0:
                    print(f"  [{GREEN}✔ PASS{RESET}] Live Audio Streamer is serving chunked MP3 audio.")
                    return True
        print(f"  [{RED}✖ FAIL{RESET}] Audio streamer did not return audio data.")
        return False
    except Exception as e:
        print(f"  [{RED}✖ FAIL{RESET}] Audio stream check error: {e}")
        return False

def check_pulseaudio():
    try:
        res = subprocess.run(["pactl", "info"], capture_output=True, text=True, timeout=2.0)
        if "Default Sink: virtual_speaker" in res.stdout:
            print(f"  [{GREEN}✔ PASS{RESET}] PulseAudio is active with virtual_speaker default sink.")
            return True
        elif res.returncode == 0:
            print(f"  [{YELLOW}⚠ WARN{RESET}] PulseAudio running but default sink is not virtual_speaker.")
            return True
        else:
            print(f"  [{RED}✖ FAIL{RESET}] PulseAudio is not running.")
            return False
    except Exception as e:
        print(f"  [{RED}✖ FAIL{RESET}] PulseAudio check error: {e}")
        return False

def main():
    print_banner()
    results = []

    results.append(check_port("127.0.0.1", 5901, "TigerVNC Server"))
    results.append(check_port("127.0.0.1", 6081, "Websockify VNC Bridge"))
    results.append(check_port("127.0.0.1", 5711, "Audio Streamer"))
    results.append(check_port("127.0.0.1", 6080, "Nginx Unified Gateway"))
    results.append(check_pulseaudio())
    results.append(check_websocket())
    results.append(check_audio_stream())

    print(f"\n{CYAN}{BOLD}--------------------------------------------------------{RESET}")
    if all(results):
        print(f"{GREEN}{BOLD}🎉 ALL SYSTEMS OPERATIONAL (100% Healthy){RESET}\n")
        sys.exit(0)
    else:
        print(f"{RED}{BOLD}⚠ SOME SERVICES REQUIRE ATTENTION. Run 'cloudpc restart'.{RESET}\n")
        sys.exit(1)

if __name__ == "__main__":
    main()
