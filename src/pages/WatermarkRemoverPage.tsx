import { useState, useRef, useEffect } from 'react';
import { inpaintRegion } from '../lib/inpaint';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Status = 'idle' | 'ready' | 'processing' | 'done' | 'error';

export default function WatermarkRemoverPage() {
  const [image, setImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [rects, setRects] = useState<Rect[]>([]);
  const [showHint, setShowHint] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgElRef = useRef<HTMLImageElement | null>(null);

  // Drawing state
  const isDrawing = useRef(false);
  const drawStart = useRef({ x: 0, y: 0 });
  const drawingRect = useRef<Rect | null>(null);
  const [, forceRender] = useState(0);

  // --- Helpers ---
  function drawCanvas() {
    const canvas = canvasRef.current;
    const img = imgElRef.current;
    if (!canvas || !img) return;

    const parent = canvas.parentElement!;
    const cw = parent.clientWidth;
    const aspect = img.naturalWidth / img.naturalHeight;
    const ch = cw / aspect;

    canvas.width = cw * 2;
    canvas.height = ch * 2;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    const ctx = canvas.getContext('2d')!;
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0, cw, ch);

    // Draw selection rectangles
    const allRects = [...rects];
    if (drawingRect.current) allRects.push(drawingRect.current);

    ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.85)';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);

    for (const r of allRects) {
      const rx = r.x * cw, ry = r.y * ch;
      const rw = r.w * cw, rh = r.h * ch;
      ctx.fillRect(rx, ry, rw, rh);
      ctx.strokeRect(rx, ry, rw, rh);
    }

    // Number labels
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textBaseline = 'top';
    for (let i = 0; i < allRects.length; i++) {
      const r = allRects[i];
      ctx.fillText(`${i + 1}`, r.x * cw + 4, r.y * ch + 4);
    }
  }

  useEffect(() => {
    drawCanvas();
  });

  // --- File handling ---
  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('请选择图片文件'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('图片大小不能超过 10MB'); return; }
    setError(null);
    setResultImage(null);
    setRects([]);
    setShowHint(true);
    setStatus('ready');

    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result as string); };
    reader.onerror = () => setError('读取图片失败');
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.onload = () => {
      imgElRef.current = img;
      forceRender(n => n + 1);
    };
    img.src = image;
  }, [image]);

  // --- Mouse handlers for rectangle drawing ---
  function getRelPos(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  }

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (status !== 'ready') return;
    setShowHint(false);
    const p = getRelPos(e);
    isDrawing.current = true;
    drawStart.current = p;
    drawingRect.current = null;
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const p = getRelPos(e);
    drawingRect.current = {
      x: Math.min(drawStart.current.x, p.x),
      y: Math.min(drawStart.current.y, p.y),
      w: Math.abs(p.x - drawStart.current.x),
      h: Math.abs(p.y - drawStart.current.y),
    };
    drawCanvas();
  }

  function handleMouseUp() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const r = drawingRect.current;
    if (r && r.w > 0.008 && r.h > 0.008) {
      setRects(prev => [...prev, r]);
    }
    drawingRect.current = null;
    drawCanvas();
  }

  function undoRect() { setRects(prev => prev.slice(0, -1)); }
  function clearRects() { setRects([]); }

  // --- Process: local canvas inpainting ---
  async function handleRemoveWatermark() {
    if (!image || rects.length === 0) return;
    setStatus('processing');
    setError(null);

    try {
      await new Promise(r => requestAnimationFrame(r));

      const img = imgElRef.current!;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const el = document.getElementById('inpaint-status');

      // Generate binary mask image from rectangles
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = w; maskCanvas.height = h;
      const mctx = maskCanvas.getContext('2d')!;
      mctx.fillStyle = '#000000'; mctx.fillRect(0, 0, w, h);
      mctx.fillStyle = '#ffffff';
      for (const r of rects) {
        mctx.fillRect(Math.round(r.x*w), Math.round(r.y*h), Math.round(r.w*w), Math.round(r.h*h));
      }
      const maskDataUrl = maskCanvas.toDataURL('image/png');

      let resultImageUrl: string | null = null;

      // Try local Python OpenCV service
      try {
        if (el) el.textContent = 'OpenCV 服务处理中…';
        const resp = await fetch('http://127.0.0.1:8902/inpaint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: img.src, mask: maskDataUrl, method: 'telea' }),
          signal: AbortSignal.timeout(30000),
        });
        if (resp.ok) {
          const d = await resp.json();
          if (d.image) resultImageUrl = d.image;
        }
      } catch { /* fall through */ }

      if (!resultImageUrl) {
        if (el) el.textContent = '使用本地算法…';
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = w; tempCanvas.height = h;
        const ctx = tempCanvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);

        const mask: boolean[] = new Array(w * h).fill(false);
        for (const r of rects) {
          const px = Math.round(r.x*w), py = Math.round(r.y*h);
          const xEnd = Math.min(px + Math.round(r.w*w), w);
          const yEnd = Math.min(py + Math.round(r.h*h), h);
          for (let y = py; y < yEnd; y++)
            for (let x = px; x < xEnd; x++) mask[y*w + x] = true;
        }

        const resultData = await inpaintRegion(imageData.data, w, h, mask, (msg) => {
          if (el) el.textContent = msg;
        });

        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = w; resultCanvas.height = h;
        const rctx = resultCanvas.getContext('2d')!;
        rctx.putImageData(new ImageData(new Uint8ClampedArray(resultData), w, h), 0, 0);
        resultImageUrl = resultCanvas.toDataURL('image/png');
      }

      setResultImage(resultImageUrl);
      setStatus('done');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '处理失败，请重试';
      setError(msg);
      setStatus('error');
    }
  }

  function handleReset() {
    setImage(null);
    setResultImage(null);
    setStatus('idle');
    setError(null);
    setRects([]);
    setShowHint(true);
    drawingRect.current = null;
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
      <h2 className="text-lg font-semibold mb-2">图像去水印</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        纯本地处理，不上传图片。在图片上框选水印区域，然后点击去除。
      </p>

      {/* Upload */}
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
          <div className="text-3xl mb-2 text-gray-400">+</div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            点击或拖拽图片到此处
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            支持 JPG / PNG / WebP，最大 10MB。图片仅在本地处理。
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

      {/* Canvas + result */}
      {image && (
        <div className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row items-start">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium">原图（框选水印区域）</p>
              <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                <canvas
                  ref={canvasRef}
                  className="block w-full cursor-crosshair"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
                {showHint && rects.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-xs text-gray-400 bg-white/70 dark:bg-black/50 px-2 py-1 rounded">
                      在图片上拖拽框选水印区域
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium">
                结果
                {status === 'processing' && '（处理中…）'}
              </p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 min-h-[120px] flex items-center justify-center">
                {resultImage ? (
                  <img
                    src={resultImage}
                    alt="去水印结果"
                    className="max-w-full h-auto max-h-96 mx-auto object-contain"
                  />
                ) : status === 'processing' ? (
                  <div className="text-center py-10">
                    <div className="inline-block w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
                    <p id="inpaint-status" className="text-sm text-gray-400">初始化引擎…</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">框选后点「去除水印」</p>
                )}
              </div>
            </div>
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap gap-2">
            {rects.length > 0 && (
              <>
                <span className="text-xs text-gray-400 self-center mr-1">
                  已选 {rects.length} 个区域
                </span>
                <button
                  onClick={undoRect}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  撤销
                </button>
                <button
                  onClick={clearRects}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  清空
                </button>
              </>
            )}
            <button
              onClick={handleRemoveWatermark}
              disabled={status === 'processing' || rects.length === 0}
              className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'processing' ? '处理中…' : '去除水印'}
            </button>
            {resultImage && (
              <a
                href={resultImage}
                download="watermark-removed.png"
                className="px-4 py-2 text-sm rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
              >
                下载结果
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

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}
    </div>
  );
}





