/**
 * 图像去水印 - HTTP Cloud Function
 * 调用 Python OpenCV 后端处理图片
 */
const http = require('http');
const { URL } = require('url');
const { spawn } = require('child_process');
const path = require('path');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sendJson(res, statusCode, data) {
  const body = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...CORS_HEADERS,
  });
  res.end(body);
}

function sendOptions(res) {
  res.writeHead(204, CORS_HEADERS);
  res.end();
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => resolve(raw));
    req.on('error', reject);
  });
}

/**
 * 调用 Python OpenCV 处理图像去水印
 */
function callPythonOpenCV(imageBase64) {
  return new Promise((resolve, reject) => {
    const script = `
import cv2
import numpy as np
import base64
import json
import sys

def process(image_b64):
    try:
        # 解码
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

        # 修复
        result = cv2.inpaint(img, mask, 5, cv2.INPAINT_TELEA)

        # 编码
        _, buffer = cv2.imencode('.png', result)
        result_b64 = base64.b64encode(buffer).decode('utf-8')
        return json.dumps({"image": f"data:image/png;base64,{result_b64}"})

    except Exception as e:
        return json.dumps({"error": str(e)})

print(process(sys.argv[1]))
`;

    const proc = spawn('python3', ['-c', script, imageBase64], {
      timeout: 60000,
      maxBuffer: 20 * 1024 * 1024,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => { stdout += data.toString(); });
    proc.stderr.on('data', (data) => { stderr += data.toString(); });
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python 进程退出(${code}): ${stderr.slice(0, 500)}`));
        return;
      }
      try {
        resolve(JSON.parse(stdout.trim()));
      } catch {
        reject(new Error(`Python 输出解析失败: ${stdout.slice(0, 200)}`));
      }
    });
    proc.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  if (req.method === 'OPTIONS') {
    sendOptions(res);
    return;
  }

  try {
    if (req.method === 'POST' && pathname === '/remove-watermark') {
      const raw = await readBody(req);
      const body = JSON.parse(raw);
      const { image } = body;

      if (!image || typeof image !== 'string') {
        sendJson(res, 400, { error: '缺少 image 参数' });
        return;
      }

      // Extract raw base64
      const base64Data = image.includes('base64,')
        ? image.split('base64,')[1]
        : image;

      const result = await callPythonOpenCV(base64Data);

      if (result.error) {
        sendJson(res, 500, { error: result.error });
      } else {
        sendJson(res, 200, result);
      }
    } else {
      sendJson(res, 404, { error: 'Not found' });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    console.error('[remove-watermark]', msg, e);
    sendJson(res, 500, { error: msg });
  }
});

server.listen(9000, () => {
  console.log('[remove-watermark] HTTP function listening on port 9000');
});
