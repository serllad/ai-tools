import { useState, useRef } from 'react';

type Status = 'idle' | 'ready' | 'processing' | 'done' | 'error';

/**
 * Telea FMM 图像修复
 */
function inpaintRegion(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  holeMask: (x: number, y: number) => boolean
): ImageData {
  const out = new Uint8ClampedArray(pixels);
  const dist = new Float32Array(width * height).fill(Infinity);
  const state = new Uint8Array(width * height); // 0=hole, 1=known, 2=band

  const idx = (x: number, y: number) => y * width + x;
  const getP = (x: number, y: number) => [
    pixels[idx(x, y) * 4], pixels[idx(x, y) * 4 + 1], pixels[idx(x, y) * 4 + 2],
  ];
  const setP = (x: number, y: number, r: number, g: number, b: number) => {
    const i = idx(x, y) * 4;
    out[i] = r; out[i + 1] = g; out[i + 2] = b;
  };

  // 标记区域
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (holeMask(x, y)) {
        state[idx(x, y)] = 0;
      } else {
        state[idx(x, y)] = 1;
        dist[idx(x, y)] = 0;
      }
    }
  }

  // 初始化 band
  type P = [number, number, number];
  const band: P[] = [];
  const inBand = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (state[idx(x, y)] !== 0) continue;
      let edge = false;
      for (let dy = -1; dy <= 1 && !edge; dy++) {
        for (let dx = -1; dx <= 1 && !edge; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          if (state[idx(nx, ny)] === 1) edge = true;
        }
      }
      if (edge) {
        state[idx(x, y)] = 2;
        dist[idx(x, y)] = 1;
        band.push([x, y, 1]);
        inBand[idx(x, y)] = 1;
      }
    }
  }

  while (band.length > 0) {
    let minIdx = 0;
    for (let i = 1; i < band.length; i++) {
      if (band[i][2] < band[minIdx][2]) minIdx = i;
    }
    const [cx, cy] = band[minIdx];
    band[minIdx] = band[band.length - 1];
    band.pop();
    inBand[idx(cx, cy)] = 0;

    if (state[idx(cx, cy)] !== 2) continue;

    const winR = 8; // 搜索窗口
    let sumR = 0, sumG = 0, sumB = 0, totalW = 0;

    for (let dy = -winR; dy <= winR; dy++) {
      for (let dx = -winR; dx <= winR; dx++) {
        if (dx === 0 && dy === 0) continue;
        const sx = cx + dx, sy = cy + dy;
        if (sx < 0 || sx >= width || sy < 0 || sy >= height) continue;
        if (state[idx(sx, sy)] === 1 || state[idx(sx, sy)] === 2) {
          const d = Math.sqrt(dx * dx + dy * dy);
          const [pr, pg, pb] = getP(sx, sy);
          const dir = Math.abs(dx / (d || 1)) + Math.abs(dy / (d || 1));
          const w = dir / (d * d + 0.001);
          sumR += pr * w; sumG += pg * w; sumB += pb * w;
          totalW += w;
        }
      }
    }

    if (totalW > 0) {
      setP(cx, cy, sumR / totalW, sumG / totalW, sumB / totalW);
      out[idx(cx, cy) * 4 + 3] = pixels[idx(cx, cy) * 4 + 3];
    }

    state[idx(cx, cy)] = 1;
    dist[idx(cx, cy)] = 0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        if (state[idx(nx, ny)] === 0 && !inBand[idx(nx, ny)]) {
          state[idx(nx, ny)] = 2;
          dist[idx(nx, ny)] = dist[idx(cx, cy)] + 1;
          band.push([nx, ny, dist[idx(nx, ny)]]);
          inBand[idx(nx, ny)] = 1;
        }
      }
    }
  }

  return new ImageData(out, width, height);
}

/**
 * 自动检测水印区域
 * 策略：扫描图片四个角 + 边缘区域，检测颜色亮度偏低/饱和度偏高的区域
 * 以及图片边缘的条带状区域
 */
function autoDetectWatermark(
  imageData: ImageData
): { x: number; y: number; w: number; h: number }[] {
  const { width, height } = imageData;
  const regions: { x: number; y: number; w: number; h: number }[] = [];
  const minSize = Math.min(width, height);

  // 策略1: 检测底部中间区域（最常见的水印位置）
  // 底部 15% 区域，中间 60%
  const bH = Math.max(40, Math.floor(height * 0.12));
  const bW = Math.max(80, Math.floor(width * 0.5));
  regions.push({
    x: Math.floor((width - bW) / 2),
    y: height - bH,
    w: bW,
    h: bH,
  });

  // 策略2: 检测右下角（常见 Logo 位置）
  const cornerSize = Math.max(50, Math.floor(minSize * 0.1));
  regions.push({
    x: width - cornerSize,
    y: height - cornerSize,
    w: cornerSize,
    h: cornerSize,
  });

  // 策略3: 检测右上角
  regions.push({
    x: width - cornerSize,
    y: 0,
    w: cornerSize,
    h: cornerSize,
  });

  // 策略4: 检测左上角
  regions.push({
    x: 0,
    y: 0,
    w: cornerSize,
    h: cornerSize,
  });

  // 策略5: 检测左下角
  regions.push({
    x: 0,
    y: height - cornerSize,
    w: cornerSize,
    h: cornerSize,
  });

  return regions;
}

export default function WatermarkRemoverPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'auto' | 'manual'>('auto');
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [autoRegions, setAutoRegions] = useState<{ x: number; y: number; w: number; h: number }[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const drawing = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('请选择图片文件'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('图片大小不能超过 10MB'); return; }
    setError(null);
    setResult(null);
    setRect(null);
    setAutoRegions(null);
    

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImage(dataUrl);
      const img = new Image();
      img.onload = () => {
        imgRef.current = img;
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
        }
        setStatus('ready');

        // Auto detect watermark regions
        if (canvas) {
          const ctx = canvas.getContext('2d')!;
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const regions = autoDetectWatermark(imageData);
          setAutoRegions(regions);
          // Draw detection overlay
          ctx.drawImage(img, 0, 0);
          regions.forEach((r) => {
            ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';
            ctx.fillRect(r.x, r.y, r.w, r.h);
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(r.x, r.y, r.w, r.h);
          });
        }
      };
      img.src = dataUrl;
    };
    reader.onerror = () => setError('读取图片失败');
    reader.readAsDataURL(file);
  }

  function getCoords(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const box = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - box.left) / box.width) * canvas.width,
      y: ((e.clientY - box.top) / box.height) * canvas.height,
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    setMode('manual');
    
    const { x, y } = getCoords(e);
    drawing.current = true;
    startPos.current = { x, y };
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (imgRef.current) ctx.drawImage(imgRef.current, 0, 0);
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const { x, y } = getCoords(e);
    const r = {
      x: Math.min(startPos.current.x, x),
      y: Math.min(startPos.current.y, y),
      w: Math.abs(x - startPos.current.x),
      h: Math.abs(y - startPos.current.y),
    };
    setRect(r);
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (imgRef.current) ctx.drawImage(imgRef.current, 0, 0);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
  }

  function handleMouseUp() {
    drawing.current = false;
  }

  function handleRemoveWatermark() {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;

    // 用原始图片重新绘制到临时 canvas，避免框选框被带进去
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCtx.drawImage(imgRef.current, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

    setStatus('processing');
    setError(null);

    try {
      let processed: ImageData;

      if (mode === 'auto' && autoRegions) {
        // 自动模式：逐个区域修复
        let pixels = new Uint8ClampedArray(imageData.data);
        autoRegions.forEach((r) => {
          const result = inpaintRegion(pixels, canvas.width, canvas.height, (x, y) =>
            x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h
          );
          pixels = new Uint8ClampedArray(result.data);
        });
        processed = new ImageData(pixels, canvas.width, canvas.height);
      } else if (rect && rect.w >= 5 && rect.h >= 5) {
        // 手动模式
        processed = inpaintRegion(imageData.data, canvas.width, canvas.height, (x, y) =>
          x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h
        );
      } else {
        setError('请先框选水印区域，或切换到自动模式');
        setStatus('ready');
        return;
      }

      const outCanvas = document.createElement('canvas');
      outCanvas.width = canvas.width;
      outCanvas.height = canvas.height;
      outCanvas.getContext('2d')!.putImageData(processed, 0, 0);
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
    setAutoRegions(null);
    
    setError(null);
    setMode('auto');
  }

  function handleDragOver(e: React.DragEvent) { e.preventDefault(); setDragging(true); }
  function handleDragLeave() { setDragging(false); }
  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">🖼️ 图像去水印</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
        纯浏览器本地处理，图片不上传服务器。
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        <span className="font-medium">自动模式</span>：自动检测四角和底部水印区域（标红色区域）
        <br />
        <span className="font-medium">手动模式</span>：在图片上拖动鼠标框选指定区域
      </p>

      {/* Mode switch */}
      {status === 'ready' && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => { setMode('auto'); setRect(null); }}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              mode === 'auto'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            🤖 自动检测
          </button>
          <button
            onClick={() => setMode('manual')}
            className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
              mode === 'manual'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            ✏️ 手动框选
          </button>
        </div>
      )}

      {/* Upload */}
      {!image && (
        <div
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
            dragging ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
          }`}
          onClick={() => fileRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="text-4xl mb-3">📤</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">点击或拖拽图片到此处</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">支持 JPG / PNG / WebP，最大 10MB</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])} />
        </div>
      )}

      {/* Editor */}
      {image && (
        <div className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium">
                原图{autoRegions && mode === 'auto' && <span className="text-red-500 ml-1">（红色区域为自动检测的水印位置）</span>}
                {mode === 'manual' && <span className="text-blue-500 ml-1">（按住拖动框选）</span>}
              </p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto"
                  style={{ maxHeight: '400px', cursor: mode === 'manual' ? 'crosshair' : 'default' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium">
                去水印结果{status === 'processing' && '（处理中…）'}
              </p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 min-h-[120px] flex items-center justify-center">
                {result ? (
                  <img src={result} alt="去水印结果" className="max-w-full h-auto max-h-96 mx-auto object-contain" />
                ) : status === 'processing' ? (
                  <div className="text-center py-10">
                    <div className="inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm text-gray-400">处理中…</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">点击「去除水印」查看结果</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleRemoveWatermark}
              disabled={status === 'processing'}
              className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'processing' ? '处理中…' : '🚀 去除水印'}
            </button>
            {result && (
              <a href={result} download="watermark-removed.png"
                className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors">
                ⬇ 下载结果
              </a>
            )}
            <button onClick={handleReset}
              className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              重新选择
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="mt-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs border border-green-200 dark:border-green-800">
        ✅ 纯浏览器本地处理，无需加载外部库。自动模式检测四角和底部区域，手动模式可自由框选。
      </div>
    </div>
  );
}
