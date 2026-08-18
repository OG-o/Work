#!/usr/bin/env python3
"""
Ultra-Low Latency PulseAudio Web Streamer for Mobile Devices
Streams system audio from virtual_speaker.monitor over HTTP MP3 chunked stream on port 5711.
"""

import sys
import subprocess
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import time

PORT = 5711
clients = set()
lock = threading.Lock()

class AudioStreamHandler(BaseHTTPRequestHandler):
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

            # Start ffmpeg capture for this client
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
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Suppress routine HTTP request logging
        pass

def run_server():
    server = HTTPServer(("0.0.0.0", PORT), AudioStreamHandler)
    print(f"🔊 Live Audio Streaming Server listening on http://0.0.0.0:{PORT}/audio.mp3")
    server.serve_forever()

if __name__ == "__main__":
    run_server()
