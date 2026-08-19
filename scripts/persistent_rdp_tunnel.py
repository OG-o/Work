#!/usr/bin/env python3
"""
24/7 Bulletproof Persistent RDP Tunnel Daemon for Windows Remote Desktop (MSTSC)
Maintains continuous PTY keepalive connection to Anycast TCP gateway on port 443.
Auto-heals and generates RDP_CONNECTION_INFO.txt for instant 1-step connection.
"""

import os
import pty
import re
import subprocess
import time
import sys

INFO_FILE = "/workspaces/Work/RDP_CONNECTION_INFO.txt"
ADDR_FILE = "/home/codespace/.vnc/rdp_public_address.txt"

def log(msg):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] [RDP Tunnel] {msg}", flush=True)

def write_info(host_port):
    parts = host_port.split(":")
    host = parts[0]
    port = parts[1] if len(parts) > 1 else "3389"

    content = f"""========================================================
   🖥️ WINDOWS REMOTE DESKTOP (MSTSC) CONNECTION INFO   
========================================================

👉 PC Name / Computer: {host}:{port}
👉 Username:           codespace
👉 Password:           codespace
👉 Session:            Live Desktop / Xorg

--------------------------------------------------------
Instructions for Windows Remote Desktop (mstsc / Mobile):
1. Open Remote Desktop Connection app
2. In 'Computer' or 'PC Name', enter: {host}:{port}
3. Enter User: codespace | Password: codespace
4. Tap Connect!
========================================================
"""
    try:
        with open(INFO_FILE, "w") as f:
            f.write(content)
        with open(ADDR_FILE, "w") as f:
            f.write(f"{host}:{port}")
    except Exception as e:
        log(f"Error writing info file: {e}")

def run_tunnel():
    os.makedirs("/home/codespace/.vnc", exist_ok=True)
    
    while True:
        log("Spawning persistent SSH TCP tunnel to a.pinggy.io:443...")
        master, slave = pty.openpty()
        cmd = [
            'ssh',
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'ServerAliveInterval=5',
            '-o', 'ServerAliveCountMax=3',
            '-p', '443',
            '-R0:localhost:3389',
            'tcp@a.pinggy.io'
        ]

        proc = subprocess.Popen(
            cmd,
            stdin=slave,
            stdout=slave,
            stderr=slave,
            close_fds=True
        )
        os.close(slave)

        buffer = b""
        assigned = False

        while proc.poll() is None:
            try:
                chunk = os.read(master, 1024)
                if not chunk:
                    break
                buffer += chunk
                text = buffer.decode('utf-8', errors='ignore')

                if not assigned:
                    m = re.search(r'tcp://([a-zA-Z0-9.-]+:[0-9]+)', text)
                    if m:
                        host_port = m.group(1)
                        log(f"🎉 ACTIVE PUBLIC ENDPOINT: {host_port}")
                        write_info(host_port)
                        assigned = True
            except OSError:
                break
            except Exception as e:
                log(f"Read error: {e}")
                break
            time.sleep(0.05)

        log("Tunnel process exited. Re-establishing connection in 2 seconds...")
        try:
            proc.terminate()
            proc.wait(timeout=2)
        except Exception:
            try:
                proc.kill()
            except Exception:
                pass
        os.close(master)
        time.sleep(2)

if __name__ == "__main__":
    run_tunnel()
