#!/usr/bin/env python3
"""
Remote Desktop Gateway (RDPGW) 24/7 Supervisor Daemon
Maintains the Microsoft Remote Desktop Gateway on port 9443 with PAM authentication.
"""

import os
import subprocess
import time

def run():
    env = os.environ.copy()

    # Ensure templates and config exist
    cfg_dir = "/home/codespace/.config/rdpgw"
    os.chdir(cfg_dir)

    print("[RDPGW Supervisor] Launching rdpgw services...", flush=True)

    auth_proc = None
    gw_proc = None

    while True:
        try:
            if auth_proc is None or auth_proc.poll() is not None:
                auth_proc = subprocess.Popen(
                    ["sudo", "/usr/local/bin/rdpgw-auth", "-s", "/tmp/rdpgw-auth.sock", "-n", "rdpgw", "--allow-uid=1000"],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                print("[RDPGW Supervisor] rdpgw-auth daemon started.", flush=True)

            if gw_proc is None or gw_proc.poll() is not None:
                gw_proc = subprocess.Popen(
                    ["/usr/local/bin/rdpgw", "-c", "/home/codespace/.config/rdpgw/rdpgw.yaml"],
                    cwd=cfg_dir,
                    env=env,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
                print("[RDPGW Supervisor] rdpgw gateway server started on port 9443.", flush=True)

        except Exception as e:
            print(f"[RDPGW Supervisor] Error: {e}", flush=True)

        time.sleep(2)

if __name__ == "__main__":
    run()
