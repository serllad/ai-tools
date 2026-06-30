import { useState, useRef } from 'react';

type Status = 'idle' | 'ready' | 'uploading' | 'processing' | 'done' | 'error';

// 通过 CloudBase 云函数调用本地 OpenCV 服务
// 需要先激活 HTTPService：控制台 → 云函数 → HTTP Service → 开通
const API_URL = 'https://wh001-d0gpvirgcdeafc90c.service.tcloudbase.com/remove-watermark';

export default function WatermarkRemoverPage() {
  const [image, setImage] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('请选择图片文件'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('图片大小不能超过 10MB'); return; }
    setError(null);
    setResult(null);
    setStatus('uploading');

    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setStatus('ready');
    };
    reader.onerror = () => setError('读取图片失败');
    reader.readAsDataURL(file);
  }

  async function handleRemoveWatermark() {
    if (!image) return;
    setStatus('processing');
    setError(null);
    setResult(null);

    try {
      const resp = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data.error || `请求失败 (${resp.status})`);
      }

      const data = await resp.json();
      setResult(data.image);
      setStatus('done');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '处理失败，请重试';
      setError(msg);
      setStatus('error');
    }
  }

  function handleReset() {
    setImage(null);
    setResult(null);
    setStatus('idle');
    setError(null);
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
        后端 OpenCV 专业算法处理，自动检测水印位置。
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
        上传图片 → 自动检测四角及底部水印 → OpenCV TELEA 算法修复 → 返回结果
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

      {/* Preview */}
      {image && (
        <div className="space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium">原图</p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <img
                  src={image}
                  alt="原图"
                  className="max-w-full h-auto max-h-96 mx-auto object-contain"
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 mb-1 font-medium">
                去水印结果
                {status === 'processing' && '（服务端 OpenCV 处理中…）'}
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
                  <p className="text-sm text-gray-400">点击「去除水印」</p>
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

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      <div className="mt-6 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs border border-green-200 dark:border-green-800">
        ✅ 后端 Python OpenCV TELEA 算法处理，自动检测水印区域，效果优于纯前端方案。
      </div>
    </div>
  );
}
