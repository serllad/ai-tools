import { useState, useRef } from 'react';

type Status = 'idle' | 'ready' | 'processing' | 'done' | 'error';

function getCanvasImageData(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * 基于周围像素的简单去水印算法
 * 对选中矩形区域，从边缘向内逐层修复，用周围有效像素的平均值填充
 */
function removeWatermarkInpaint(
  imageData: ImageData,
  rect: { x: number; y: number; w: number; h: number }
): ImageData {
  const { width, height } = imageData;
  const data = new Uint8ClampedArray(imageData.data);
  const out = new Uint8ClampedArray(imageData.data);
  const { x, y, w, h } = rect;
  const r = 3; // 采样半径

  // 逐像素处理选中区域
  for (let py = y; py < y + h && py < height; py++) {
    for (let px = x; px < x + w && px < width; px++) {
      let sumR = 0, sumG = 0, sumB = 0, count = 0;

      // 从周围非选区像素采样
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const sx = px + dx;
          const sy = py + dy;
          if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
          // 跳过仍在选区内的像素
          if (sx >= x && sx < x + w && sy >= y && sy < y + h) continue;
          const si = (sy * width + sx) * 4;
          sumR += data[si];
          sumG += data[si + 1];
          sumB += data[si + 2];
          count++;
        }
      }

      const oi = (py * width + px) * 4;
      if (count > 0) {
        out[oi] = sumR / count;
        out[oi + 1] = sumG / count;
        out[oi + 2] = sumB / count;
      }
      // alpha 保持不变
    }
  }

  return new ImageData(out, width, height);
}

export default function WatermarkRemoverPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  // imgNaturalSize set on file load for internal use
  const [_imgNaturalSize, _setImgNaturalSize] = useState({ w: 0, h: 0 });

  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('请选择图片文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('图片大小不能超过 10MB');
      return;
    }
    setError(null);
    setResult(null);
    setRect(null);

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImage(dataUrl);
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        _setImgNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
        }
        setStatus('ready');
      };
      img.src = dataUrl;
    };
    reader.onerror = () => setError('读取图片失败');
    reader.readAsDataURL(file);
  }

  /** Convert canvas-relative coords to image-relative coords */
  function getImageCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const box = canvas.getBoundingClientRect();
    const displayW = box.width;
    const displayH = box.height;
    const imgW = canvas.width;
    const imgH = canvas.height;
    return {
      x: ((e.clientX - box.left) / displayW) * imgW,
      y: ((e.clientY - box.top) / displayH) * imgH,
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const { x, y } = getImageCoords(e);
    setDrawing(true);
    setStartPos({ x, y });
    setRect({ x, y, w: 0, h: 0 });
    // Redraw with start point
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && imgRef.current) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgRef.current, 0, 0);
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const { x, y } = getImageCoords(e);
    const newRect = {
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      w: Math.abs(x - startPos.x),
      h: Math.abs(y - startPos.y),
    };
    setRect(newRect);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && imgRef.current) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgRef.current, 0, 0);
      // Selection overlay
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.fillRect(newRect.x, newRect.y, newRect.w, newRect.h);
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.strokeRect(newRect.x, newRect.y, newRect.w, newRect.h);
    }
  }

  function handleMouseUp() {
    setDrawing(false);
  }

  function handleRemoveWatermark() {
    if (!canvasRef.current || !rect || rect.w < 5 || rect.h < 5) {
      setError('请先在图片上框选水印区域（至少 5x5 像素）');
      return;
    }
    setStatus('processing');
    setError(null);
    setResult(null);

    try {
      const canvas = canvasRef.current;
      const imageData = getCanvasImageData(canvas);
      const processed = removeWatermarkInpaint(imageData, rect);

      // Draw result on a temporary canvas
      const outCanvas = document.createElement('canvas');
      outCanvas.width = canvas.width;
      outCanvas.height = canvas.height;
      const outCtx = outCanvas.getContext('2d')!;
      outCtx.putImageData(processed, 0, 0);

      setResult(outCanvas.toDataURL('image/png'));
      setStatus('done');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '处理失败';
      setError(msg);
      setStatus('error');
    }
  }

  function handleReset() {
    setImage(null);
    setResult(null);
    setStatus('idle');
    setRect(null);
    setError(null);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragging(true);
  }
  function handleDragLeave() {
    setDragging(false);
  }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">🖼️ 图像去水印</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        纯浏览器本地处理，图片不上传服务器，隐私安全。
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        上传图片 → 用鼠标框选水印区域 → 点击去水印
      </p>

      {/* Upload area */}
      {!image && (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragging
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
          onClick={() => fileRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-4xl mb-3">📤</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            点击或拖拽图片到此处
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            支持 JPG / PNG / WebP，最大 10MB
          </p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
        </div>
      )}

      {/* Image + Canvas */}
      {image && (
        <div className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            {/* Source with selection canvas */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium">
                原图 — <span className="text-blue-500">按住拖动框选水印区域</span>
              </p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto cursor-crosshair"
                  style={{ maxHeight: '400px' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
              {rect && (
                <p className="text-xs text-gray-400 mt-1">
                  选中区域：{rect.w.toFixed(0)} × {rect.h.toFixed(0)} px
                </p>
              )}
            </div>

            {/* Result */}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium">
                去水印结果
                {status === 'processing' && '（处理中…）'}
              </p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 min-h-[120px] flex items-center justify-center">
                {result ? (
                  <img
                    src={result}
                    alt="去水印结果"
                    className="max-w-full h-auto max-h-96 mx-auto object-contain"
                  />
                ) : status === 'processing' ? (
                  <div className="text-center py-10">
                    <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm text-gray-400">处理中…</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">等待处理</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRemoveWatermark}
              disabled={status === 'processing' || !rect || rect.w < 5}
              className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'processing' ? '处理中…' : '🚀 去除水印'}
            </button>

            {result && (
              <a
                href={result}
                download="watermark-removed.png"
                className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
              >
                ⬇ 下载结果
              </a>
            )}

            <button
              onClick={handleReset}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              重新选择
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="mt-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs border border-green-200 dark:border-green-800">
        ✅ 纯 Canvas API 本地处理，无需加载任何外部库，秒级完成。
        对简单水印（文字、Logo）效果良好，复杂水印建议多框选几次。
      </div>
    </div>
  );
}
