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
import http.server, json, os, socket, sys, threading

DIRECTORY = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else int(os.environ.get("PORT", "8000"))

# In-memory relay only (the control panel's localStorage is the real persistence).
_lock = threading.Lock()
_state = {"data": None, "v": -1}


class Handler(http.server.SimpleHTTPRequestHandler):
    # HTTP/1.1 keeps the TCP connection alive. The default (HTTP/1.0) closes it after every
    # response, and OBS runs ~6 browser sources each polling /state ~3x/second — that is a new
    # connection ~20x/second, which piles up TIME_WAIT sockets on Windows and eventually stalls.
    protocol_version = "HTTP/1.1"

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
            code, cur = 400, -1
            try:
                obj = json.loads(raw)
                v = int(obj.get("_v", 0)) if isinstance(obj, dict) else 0
                with _lock:
                    if v >= _state["v"]:          # ignore out-of-order / stale writes
                        _state["data"] = raw
                        _state["v"] = v
                        code = 204
                    else:
                        # The writer is BEHIND us (its localStorage was cleared / it is a fresh
                        # panel on a long-running server). Silently dropping this used to lock the
                        # panel out forever: every edit was discarded and overlays kept the old
                        # state. Tell the client our version so it can re-sync and republish.
                        code, cur = 409, _state["v"]
            except Exception:
                code = 400
            if code == 409:
                body = json.dumps({"_v": cur}).encode("utf-8")
                self.send_response(409)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)
                return
            self.send_response(code)
            if code != 204:                       # HTTP/1.1: a bodyless non-204 still needs a length
                self.send_header("Content-Length", "0")
            self.end_headers()
            return
        self.send_response(404)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def log_message(self, *a):
        pass  # quiet


class DualStackServer(http.server.ThreadingHTTPServer):
    """Listen on IPv6 AND IPv4.

    On Windows, `localhost` resolves to ::1 (IPv6) *before* 127.0.0.1, and Chromium — which is
    both Edge and the OBS browser source — tries ::1 first. Python's default ("", PORT) binds
    IPv4 only, so those clients hit a refused connection on ::1. Firefox falls back to IPv4
    quickly, which is exactly why the overlays could work in Firefox but not in Edge/OBS on the
    same machine. Binding dual-stack serves both.
    """
    allow_reuse_address = True
    daemon_threads = True
    address_family = socket.AF_INET6

    def server_bind(self):
        try:
            self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        except OSError:
            pass                                   # some stacks are v6-only or v4-only; bind anyway
        return super().server_bind()


def make_server():
    try:
        return DualStackServer(("::", PORT), Handler)          # ::1 and 127.0.0.1
    except OSError:
        http.server.ThreadingHTTPServer.allow_reuse_address = True
        return http.server.ThreadingHTTPServer(("", PORT), Handler)   # IPv4-only fallback


if __name__ == "__main__":
    httpd = make_server()
    print(f"ORBITAL sync server  ->  http://localhost:{PORT}/index.html   (serving {DIRECTORY})")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
