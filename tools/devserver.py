"""Local game server (no caching, so a refresh always loads the newest files) that also saves settings to a file.
Run from anywhere:  python tools/devserver.py   ->  http://localhost:8765/index.html
  GET  /settings  -> settings.json in the game folder (404 if none yet)
  POST /settings  -> writes settings.json in the game folder
Play.bat starts this hidden and opens the game."""
import http.server, json, os, socketserver

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
SETTINGS = os.path.join(ROOT, 'settings.json')


class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        if self.path.split('?')[0] == '/settings':
            if not os.path.exists(SETTINGS):
                self.send_response(404); self.end_headers(); return
            body = open(SETTINGS, 'rb').read()
            self.send_response(200); self.send_header('Content-Type', 'application/json'); self.end_headers()
            self.wfile.write(body); return
        super().do_GET()

    def do_POST(self):
        if self.path.split('?')[0] != '/settings':
            self.send_response(404); self.end_headers(); return
        n = int(self.headers.get('Content-Length', 0))
        try:
            data = json.loads(self.rfile.read(n).decode('utf8'))
            with open(SETTINGS + '.tmp', 'w', encoding='utf8') as f:
                json.dump(data, f, indent=1)
            os.replace(SETTINGS + '.tmp', SETTINGS)
            self.send_response(204)
        except Exception:
            self.send_response(400)
        self.end_headers()

    def log_message(self, *args):
        pass


# on Windows SO_REUSEADDR lets a second server bind the same port, so only enable it elsewhere
socketserver.TCPServer.allow_reuse_address = os.name != 'nt'
if __name__ == '__main__':
    with socketserver.ThreadingTCPServer(('', 8765), Handler) as httpd:
        httpd.serve_forever()
