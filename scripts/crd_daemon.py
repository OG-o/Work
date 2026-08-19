#!/usr/bin/env python3
"""
Chrome Remote Desktop Persistent Supervisor Daemon
Keeps Chrome Remote Desktop Host active 24/7 on DISPLAY=:1.
"""

import os
import subprocess
import time

def run():
    env = os.environ.copy()
    env["DISPLAY"] = ":1"
    env["XAUTHORITY"] = "/home/codespace/.Xauthority"

    cmd = [
        "/opt/google/chrome-remote-desktop/chrome-remote-desktop-host",
        "--host-config=/etc/chrome-remote-desktop/host.json",
        "--console"
    ]

    while True:
        print("[CRD Daemon] Starting Chrome Remote Desktop Host...", flush=True)
        try:
            proc = subprocess.Popen(
                cmd,
                env=env,
                stdout=open("/home/codespace/.vnc/crd_live.log", "a"),
                stderr=subprocess.STDOUT
            )
            proc.wait()
            print(f"[CRD Daemon] Host exited with code {proc.returncode}. Restarting in 2s...", flush=True)
        except Exception as e:
            print(f"[CRD Daemon] Error: {e}", flush=True)
        time.sleep(2)

if __name__ == "__main__":
    run()
