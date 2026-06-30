import { useState, useRef, useEffect } from 'react';

type Status = 'idle' | 'loading' | 'ready' | 'processing' | 'done' | 'error';

const OPENCV_CDN = 'https://docs.opencv.org/4.9.0/opencv.js';

export default function WatermarkRemoverPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [cvStatus, setCvStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [rect, setRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const cvRef = useRef<any>(null);
  const [dragging, setDragging] = useState(false);

  // Load OpenCV.js
  useEffect(() => {
    if ((window as any).cv) {
      cvRef.current = (window as any).cv;
      setCvStatus('ready');
      return;
    }
    const script = document.createElement('script');
    script.src = OPENCV_CDN;
    script.async = true;
    script.onload = () => {
      (window as any).cv['onRuntimeInitialized'] = () => {
        cvRef.current = (window as any).cv;
        setCvStatus('ready');
      };
    };
    script.onerror = () => setCvStatus('error');
    document.body.appendChild(script);
    return () => {
      // script cleanup not needed, singleton
    };
  }, []);

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
      // Reset canvas after image load
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
      };
      img.src = dataUrl;
    };
    reader.onerror = () => {
      setError('读取图片失败');
    };
    reader.readAsDataURL(file);
  }

  // Mouse events for drawing rectangle
  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect_ = canvas.getBoundingClientRect();
    const x = (e.clientX - rect_.left) * (canvas.width / rect_.width);
    const y = (e.clientY - rect_.top) * (canvas.height / rect_.height);
    setDrawing(true);
    setStartPos({ x, y });
    setRect({ x, y, w: 0, h: 0 });
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) return;
    const canvas = canvasRef.current!;
    const rect_ = canvas.getBoundingClientRect();
    const x = (e.clientX - rect_.left) * (canvas.width / rect_.width);
    const y = (e.clientY - rect_.top) * (canvas.height / rect_.height);
    const newRect = {
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      w: Math.abs(x - startPos.x),
      h: Math.abs(y - startPos.y),
    };
    setRect(newRect);

    // Redraw canvas
    const ctx = canvas.getContext('2d')!;
    if (imgRef.current) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgRef.current, 0, 0);
      // Draw selection
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
    if (!image || !cvRef.current || !rect || rect.w < 5 || rect.h < 5) {
      setError('请先在图片上框选水印区域（至少 5x5 像素）');
      return;
    }

    setStatus('processing');
    setError(null);
    setResult(null);

    try {
      const cv = cvRef.current;

      // Load image into cv.Mat
      const img = new Image();
      img.onload = () => {
        const src = cv.imread(img);
        // Create mask: white rectangle on black background
        const mask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);

        const point1 = new cv.Point(rect.x, rect.y);
        const point2 = new cv.Point(rect.x + rect.w, rect.y + rect.h);
        cv.rectangle(mask, point1, point2, new cv.Scalar(255, 255, 255), -1);

        // Inpaint
        const dst = new cv.Mat();
        cv.inpaint(src, mask, dst, 3, cv.INPAINT_TELEA);

        // Convert result to data URL
        const canvas = document.createElement('canvas');
        canvas.width = dst.cols;
        canvas.height = dst.rows;
        cv.imshow(canvas, dst);

        setResult(canvas.toDataURL('image/png'));

        // Cleanup
        src.delete();
        mask.delete();
        dst.delete();
        point1.delete();
        point2.delete();

        setStatus('done');
      };
      img.src = image;
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
        OpenCV 本地处理，图片不上传服务器，隐私安全。
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        上传图片 → 用鼠标框选水印区域 → 点击去水印
      </p>

      {/* OpenCV loading status */}
      {cvStatus === 'loading' && (
        <div className="p-3 mb-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm border border-blue-200 dark:border-blue-800">
          ⏳ 正在加载 OpenCV 图像处理库（约 8MB）…
        </div>
      )}
      {cvStatus === 'error' && (
        <div className="p-3 mb-4 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
          ❌ OpenCV 加载失败，请刷新页面重试。
        </div>
      )}

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
            <div className="flex-1">
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
            <div className="flex-1">
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
                    <p className="text-sm text-gray-400">OpenCV 处理中…</p>
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
              disabled={status === 'processing' || cvStatus !== 'ready' || !rect || rect.w < 5}
              className="px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {status === 'processing'
                ? '处理中…'
                : cvStatus !== 'ready'
                  ? '加载 OpenCV…'
                  : '🚀 去除水印'}
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

      {/* Usage hint */}
      <div className="mt-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs border border-green-200 dark:border-green-800">
        ✅ 本工具使用 OpenCV.js 在浏览器本地处理，图片不会上传到任何服务器。
        仅需首次加载约 8MB OpenCV 库，后续秒级处理。
      </div>
    </div>
  );
}
