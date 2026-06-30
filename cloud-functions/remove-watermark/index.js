/**
 * 图像去水印 - HTTP Cloud Function
 *
 * 接收前端上传的图片（base64），调用 CloudBase AI 多模态大模型
 * 识别并去除水印后返回处理后的图片。
 *
 * 使用模型：deepseek-v4-flash（支持图像理解，价格最低）
 */

const http = require('http');
const { URL } = require('url');
const tcb = require('@cloudbase/node-sdk');

const ENV_ID = process.env.TCB_ENV_ID || 'wh001-d0gpvirgcdeafc90c';

// Initialize CloudBase
const app = tcb.init({ env: ENV_ID });
const ai = app.ai();

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

async function handleRemoveWatermark(body) {
  const { image } = body;

  if (!image || typeof image !== 'string') {
    throw new Error('参数缺失：image（base64 图片数据）');
  }

  // Validate image size (10MB limit for base64 ~ 13MB encoded)
  const sizeBytes = Buffer.byteLength(image, 'utf-8');
  if (sizeBytes > 13 * 1024 * 1024) {
    throw new Error('图片过大，请上传 10MB 以内的图片');
  }

  // Data URL format: data:image/png;base64,iVBOR...
  // Or raw base64 string; handle both
  const base64Data = image.includes('base64,')
    ? image.split('base64,')[1]
    : image;

  // Call AI multi-modal model
  // deepseek-v4-flash supports image input via content array
  const model = ai.createModel('cloudbase');

  const result = await model.generateText({
    model: 'deepseek-v4-flash',
    messages: [
      {
        role: 'system',
        content:
          '你是一个专业的图片去水印助手。请分析用户提供的图片，识别其中的水印文字、Logo 或其他覆盖物，' +
          '然后用你卓越的图像处理能力生成一张去除了所有水印的图片。\n\n' +
          '要求：\n' +
          '1. 保持图片原始分辨率和质量\n' +
          '2. 水印去除后背景自然填充，不留痕迹\n' +
          '3. 仅修改水印区域，不改变图片其他内容\n' +
          '4. 直接返回去除水印后的图片（base64 编码）\n\n' +
          '回复格式：请直接输出处理后的图片，使用 Markdown 图片格式。',
      },
      {
        role: 'user',
        content: [
          { type: 'text', text: '请去除这张图中的所有水印文字和 Logo。' },
          {
            type: 'image_url',
            image_url: {
              url: image.startsWith('data:') ? image : `data:image/png;base64,${image}`,
            },
          },
        ],
      },
    ],
    temperature: 0.1,
  });

  const text = result.text || '';

  // Try to extract base64 image from the response
  // Look for markdown image pattern or raw base64
  const imgMatch = text.match(/!\[.*?\]\((data:image\/[^;]+;base64,[^)]+)\)/);
  if (imgMatch) {
    return { image: imgMatch[1] };
  }

  // Fallback: look for any data URL in the response
  const dataUrlMatch = text.match(/(data:image\/[^;]+;base64,[^\s"'<]+)/);
  if (dataUrlMatch) {
    return { image: dataUrlMatch[1] };
  }

  // If no image found in response, return the raw text for debugging
  throw new Error(
    'AI 未能生成去水印图片。返回信息：' + text.slice(0, 500)
  );
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    sendOptions(res);
    return;
  }

  try {
    if (req.method === 'POST' && pathname === '/remove-watermark') {
      const raw = await readBody(req);
      const body = JSON.parse(raw);
      const data = await handleRemoveWatermark(body);
      sendJson(res, 200, data);
    } else {
      sendJson(res, 404, { error: 'Not found' });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Internal error';
    console.error('[remove-watermark]', msg, e);
    sendJson(res, 400, { error: msg });
  }
});

server.listen(9000, () => {
  console.log('[remove-watermark] HTTP function listening on port 9000');
});
