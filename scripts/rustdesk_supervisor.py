#!/usr/bin/env python3
"""
RustDesk 24/7 Persistent Supervisor Daemon
Keeps RustDesk active on DISPLAY=:1 with password 'codespace'.
"""

import os
import subprocess
import time

def run():
    env = os.environ.copy()
    env["DISPLAY"] = ":1"
    env["XAUTHORITY"] = "/home/codespace/.Xauthority"

    try:
        subprocess.run(["sudo", "rustdesk", "--password", "codespace"], timeout=5)
    except Exception as e:
        print(f"[RustDesk Supervisor] Set password error: {e}", flush=True)

    while True:
        print("[RustDesk Supervisor] Starting RustDesk on DISPLAY=:1...", flush=True)
        try:
            with open("/home/codespace/.vnc/rustdesk_live.log", "a") as logfile:
                proc = subprocess.Popen(
                    ["/usr/bin/rustdesk"],
                    env=env,
                    stdout=logfile,
                    stderr=subprocess.STDOUT
                )
                proc.wait()
            print(f"[RustDesk Supervisor] RustDesk process exited with code {proc.returncode}. Restarting in 1s...", flush=True)
        except Exception as e:
            print(f"[RustDesk Supervisor] Exception: {e}", flush=True)
        time.sleep(1)

if __name__ == "__main__":
    run()
