#!/usr/bin/env python3
"""
Persistent Public RDP Tunnel Supervisor & .rdp File Generator
Maintains continuous public TCP tunnel for XRDP port 3389 and generates 1-click .rdp connection files.
"""

import os
import pty
import re
import subprocess
import threading
import time

RDP_ADDRESS_FILE = "/home/codespace/.vnc/rdp_public_address.txt"
RDP_CONFIG_FILE = "/usr/share/novnc/cloudpc.rdp"
lock = threading.Lock()

current_rdp_address = None

def generate_rdp_file(host_port):
    if not host_port:
        return
    parts = host_port.split(":")
    host = parts[0]
    port = parts[1] if len(parts) > 1 else "3389"

    rdp_content = f"""full address:s:{host}:{port}
username:s:codespace
prompt for credentials:i:1
administrative session:i:1
screen mode id:i:2
use multimon:i:0
desktopwidth:i:1920
desktopheight:i:1080
session bpp:i:24
compression:i:1
keyboardhook:i:2
audiomode:i:0
redirectclipboard:i:1
redirectprinters:i:0
redirectcomports:i:0
redirectsmartcards:i:0
displayconnectionbar:i:1
autoreconnection enabled:i:1
bandwidthautodetect:i:1
networkautodetect:i:1
connection type:i:6
enableworkspacereconnect:i:1
"""
    try:
        with open(RDP_CONFIG_FILE, "w") as f:
            f.write(rdp_content)
        with open("/workspaces/Work/cloudpc.rdp", "w") as f:
            f.write(rdp_content)
    except Exception as e:
        print("Error generating .rdp file:", e)

def tunnel_worker():
    global current_rdp_address
    os.makedirs("/home/codespace/.vnc", exist_ok=True)

    while True:
        try:
            print("[RDP Supervisor] Starting persistent SSH TCP tunnel to a.pinggy.io:443...")
            master, slave = pty.openpty()
            proc = subprocess.Popen(
                ['ssh', '-o', 'StrictHostKeyChecking=no', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=3', '-p', '443', '-R0:localhost:3389', 'tcp@a.pinggy.io'],
                stdin=slave, stdout=slave, stderr=slave, close_fds=True
            )
            os.close(slave)

            buffer = b""
            while proc.poll() is None:
                try:
                    chunk = os.read(master, 1024)
                    if not chunk:
                        break
                    buffer += chunk
                    text = buffer.decode('utf-8', errors='ignore')
                    
                    m = re.search(r'tcp://([a-zA-Z0-9.-]+:[0-9]+)', text)
                    if m:
                        addr = m.group(1)
                        if addr != current_rdp_address:
                            with lock:
                                current_rdp_address = addr
                            print(f"🎉 [RDP Supervisor] Active Public RDP Endpoint: {addr}")
                            with open(RDP_ADDRESS_FILE, "w") as f:
                                f.write(addr)
                            generate_rdp_file(addr)
                except OSError:
                    break
                time.sleep(0.1)

            proc.terminate()
            try:
                proc.wait(timeout=2)
            except subprocess.TimeoutExpired:
                proc.kill()
            os.close(master)
        except Exception as e:
            print("[RDP Supervisor] Tunnel error:", e)

        print("[RDP Supervisor] Tunnel closed, reconnecting in 3 seconds...")
        time.sleep(3)

if __name__ == "__main__":
    t = threading.Thread(target=tunnel_worker, daemon=True)
    t.start()
    while True:
        time.sleep(1)
