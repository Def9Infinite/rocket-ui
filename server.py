#!/usr/bin/env python3
"""
ORBITAL sync server.

Serves the overlay files AND relays the control-panel state to every page —
including separate OBS Browser Sources, which are isolated browser processes
that do NOT share localStorage. The control panel POSTs state to /state; every
overlay polls GET /state and applies it. This is what makes live updates work
across OBS.

Run:  python3 server.py [port]        (default port 8000)
Then open  http://localhost:<port>/index.html  for the control panel and use the
http://localhost:<port>/<overlay>.html URLs as OBS Browser Sources (NOT "Local file").
"""
import http.server, json, os, sys, threading

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", "8000"))

# In-memory relay only (the control panel's localStorage is the real persistence).
_lock = threading.Lock()
_state = {"data": None, "v": -1}


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=DIRECTORY, **k)

    def end_headers(self):
        # Never let OBS/CEF serve a stale copy of the app files or the state.
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path.split("?")[0] == "/state":
            with _lock:
                data = _state["data"]
            body = (data or "").encode("utf-8")
            self.send_response(200 if data else 204)
            self.send_header("Content-Type", "application/json")
            if data:
                self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            if data:
                self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        if self.path.split("?")[0] == "/state":
            n = int(self.headers.get("Content-Length", "0") or "0")
            raw = self.rfile.read(n).decode("utf-8") if n else ""
            code = 400
            try:
                obj = json.loads(raw)
                v = int(obj.get("_v", 0)) if isinstance(obj, dict) else 0
                with _lock:
                    if v >= _state["v"]:          # ignore out-of-order / stale writes
                        _state["data"] = raw
                        _state["v"] = v
                code = 204
            except Exception:
                code = 400
            self.send_response(code)
            self.end_headers()
            return
        self.send_response(404)
        self.end_headers()

    def log_message(self, *a):
        pass  # quiet


if __name__ == "__main__":
    httpd = http.server.ThreadingHTTPServer(("", PORT), Handler)
    print(f"ORBITAL sync server  ->  http://localhost:{PORT}/index.html   (serving {DIRECTORY})")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
