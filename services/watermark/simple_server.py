#!/usr/bin/env python3
"""Simple HTTP inpainting server - no Flask needed, direct http.server"""
import http.server, json, base64, os
import cv2
import numpy as np

PORT = 8902

class Handler(http.server.BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS, GET")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            self._send(200, {"status": "ok", "service": "ai-watermark"})
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/inpaint":
            self._send(404, {"error": "not found"})
            return
        try:
            n = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(n))
            image_b64 = body.get("image", "")
            if "base64," in image_b64:
                image_b64 = image_b64.split("base64,")[1]
            img = cv2.imdecode(np.frombuffer(base64.b64decode(image_b64), np.uint8), cv2.IMREAD_COLOR)
            if img is None:
                self._send(400, {"error": "image decode failed"})
                return
            h, w = img.shape[:2]
            method = body.get("method", "telea").lower()
            inpaint_m = cv2.INPAINT_TELEA if method == "telea" else cv2.INPAINT_NS
            mask_b64 = body.get("mask", "")
            if mask_b64:
                if "base64," in mask_b64:
                    mask_b64 = mask_b64.split("base64,")[1]
                mask = cv2.imdecode(np.frombuffer(base64.b64decode(mask_b64), np.uint8), cv2.IMREAD_GRAYSCALE)
                if mask is None:
                    self._send(400, {"error": "mask decode failed"})
                    return
                if mask.shape[0] != h or mask.shape[1] != w:
                    mask = cv2.resize(mask, (w, h), interpolation=cv2.INTER_NEAREST)
                _, mask = cv2.threshold(mask, 127, 255, cv2.THRESH_BINARY)
                kernel = np.ones((3, 3), np.uint8)
                mask = cv2.dilate(mask, kernel, iterations=1)
            else:
                mask = np.zeros((h, w), dtype=np.uint8)
            result = cv2.inpaint(img, mask, body.get("radius", 3), inpaint_m)
            _, buffer = cv2.imencode(".png", result)
            self._send(200, {"image": f"data:image/png;base64,{base64.b64encode(buffer).decode()}"})
        except Exception as e:
            self._send(500, {"error": str(e)})

    def log_message(self, fmt, *args):
        print(f"[watermark] {args[0]} {args[1]} {args[2]}")

if __name__ == "__main__":
    s = http.server.HTTPServer(("127.0.0.1", PORT), Handler)
    print(f"[watermark] service on {PORT}")
    s.serve_forever()
