/**
 * 图像去水印 - HTTP Cloud Function
 * 调用本地 Python OpenCV 服务处理图片
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// 本地 OpenCV 服务的公网地址
const WATERMARK_API = 'http://49.233.191.103:8900';
// 从环境变量读取 token，用于调用本地 OpenCV 服务
const AUTH_TOKEN = process.env.WATERMARK_TOKEN || 'ai-tools-default-token';

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
 * 调用本地 Python OpenCV 服务
 */
function callWatermarkService(imageBase64) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ image: `data:image/png;base64,${imageBase64}` });

    const url = new URL(WATERMARK_API);
    const client = url.protocol === 'https:' ? https : http;
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname || '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'X-Auth-Token': AUTH_TOKEN,
      },
      timeout: 30000,
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`响应解析失败: ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('请求超时')); });
    req.write(body);
    req.end();
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

      const base64Data = image.includes('base64,')
        ? image.split('base64,')[1]
        : image;

      const result = await callWatermarkService(base64Data);

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
