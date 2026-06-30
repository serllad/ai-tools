#!/usr/bin/env python3
"""
图像去水印 HTTP API 服务
运行在本地服务器，供 CloudBase 云函数通过公网调用
"""
import http.server
import json
import base64
import cv2
import numpy as np
import os

PORT = 8900
# 简单鉴权，防止被滥用
AUTH_TOKEN = os.environ.get('WATERMARK_TOKEN', 'ai-tools-default-token')


def remove_watermark(image_b64: str) -> dict:
    """使用 OpenCV 修复图片水印"""
    img_bytes = base64.b64decode(image_b64)
    img_array = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)
    h, w = img.shape[:2]

    # 自动检测水印区域
    regions = []
    bh = max(40, int(h * 0.12))
    bw = max(80, int(w * 0.5))
    regions.append((int((w - bw) / 2), h - bh, bw, bh))

    cs = max(50, int(min(w, h) * 0.1))
    for rx, ry in [(w - cs, h - cs), (w - cs, 0), (0, 0), (0, h - cs)]:
        regions.append((rx, ry, cs, cs))

    # 创建蒙版
    mask = np.zeros((h, w), dtype=np.uint8)
    for rx, ry, rw, rh in regions:
        cv2.rectangle(mask, (rx, ry), (rx + rw, ry + rh), 255, -1)

    kernel = np.ones((5, 5), np.uint8)
    mask = cv2.dilate(mask, kernel, iterations=2)

    # OpenCV TELEA 修复
    result = cv2.inpaint(img, mask, 5, cv2.INPAINT_TELEA)

    _, buffer = cv2.imencode('.png', result)
    result_b64 = base64.b64encode(buffer).decode('utf-8')
    return {"image": f"data:image/png;base64,{result_b64}"}


class Handler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors_headers()
        self.end_headers()

    def do_POST(self):
        try:
            # 鉴权
            token = self.headers.get('X-Auth-Token', '')
            if token != AUTH_TOKEN:
                self._send(403, {"error": "无权限"})
                return

            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body)
            image_data = data.get('image', '')
            if not image_data:
                self._send(400, {"error": "缺少 image 参数"})
                return

            if 'base64,' in image_data:
                image_data = image_data.split('base64,')[1]

            result = remove_watermark(image_data)
            self._send(200, result)

        except Exception as e:
            self._send(500, {"error": str(e)})

    def do_GET(self):
        self._send(200, {"status": "ok", "service": "watermark-remover"})

    def _send(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self._cors_headers()
        self.end_headers()
        self.wfile.write(body)

    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Auth-Token')

    def log_message(self, format, *args):
        print(f"[watermark-api] {self.client_address[0]} {args[0]} {args[1]} {args[2]}")


if __name__ == '__main__':
    server = http.server.HTTPServer(('0.0.0.0', PORT), Handler)
    print(f"[watermark-api] 服务启动，端口 {PORT}")
    print(f"[watermark-api] Token: {AUTH_TOKEN}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        server.server_close()
