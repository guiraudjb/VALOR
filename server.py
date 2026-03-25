import http.server
import socketserver
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.realpath(__file__))
os.chdir(DIRECTORY)

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = http.server.SimpleHTTPRequestHandler.extensions_map.copy()
    extensions_map.update({
        '.js': 'application/javascript; charset=utf-8', # CORRECTIF CRITIQUE POUR LES MODULES ES6
        '.svg': 'image/svg+xml',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2'
    })
    
    def log_message(self, format, *args):
        pass # Rend le serveur silencieux dans le terminal

if __name__ == "__main__":
    try:
        with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
            httpd.serve_forever()
    except OSError:
        sys.exit(1)
