#!/usr/bin/env python3
"""
24/7 Persistent Bore Raw TCP Tunnel Supervisor for Windows Remote Desktop (MSTSC)
Maintains zero-drop raw TCP forwarding for XRDP port 3389 over bore.pub.
"""

import os
import re
import subprocess
import time

INFO_FILE = "/workspaces/Work/RDP_CONNECTION_INFO.txt"
ADDR_FILE = "/home/codespace/.vnc/rdp_public_address.txt"

def log(msg):
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] [Bore Supervisor] {msg}", flush=True)

def write_info(host_port):
    content = f"""========================================================
   🖥️ WINDOWS REMOTE DESKTOP (MSTSC) CONNECTION INFO   
========================================================

👉 PC Name / Computer: {host_port}
👉 Username:           codespace
👉 Password:           codespace
👉 Session:            Live Desktop / Xorg

--------------------------------------------------------
Instructions for Windows Remote Desktop (mstsc / Mobile):
1. Open Remote Desktop Connection app
2. In 'Computer' or 'PC Name', enter: {host_port}
3. Enter User: codespace | Password: codespace
4. Tap Connect!
========================================================
"""
    try:
        with open(INFO_FILE, "w") as f:
            f.write(content)
        with open(ADDR_FILE, "w") as f:
            f.write(host_port)
    except Exception as e:
        log(f"Error writing info file: {e}")

def run_bore():
    os.makedirs("/home/codespace/.vnc", exist_ok=True)
    
    while True:
        log("Launching bore local 3389 --to bore.pub...")
        proc = subprocess.Popen(
            ['/usr/local/bin/bore', 'local', '3389', '--to', 'bore.pub'],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1
        )

        for line in iter(proc.stdout.readline, ''):
            if not line:
                break
            log(line.strip())
            m = re.search(r'listening at (bore\.pub:[0-9]+)', line)
            if m:
                host_port = m.group(1)
                log(f"🎉 RDP PUBLIC ADDRESS ACTIVE: {host_port}")
                write_info(host_port)

        proc.poll()
        log("Bore process stopped. Restarting in 2 seconds...")
        time.sleep(2)

if __name__ == "__main__":
    run_bore()
