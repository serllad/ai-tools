import { useRef, useState } from 'react';
import { useConfigStore } from '../store/configStore';
import { useAnimationLoop } from '../hooks/useAnimationLoop';
import { useFontLoader } from '../hooks/useFontLoader';
import { exportPng } from '../engine/pngExporter';
import { exportGif } from '../engine/gifExporter';
import { getAnimationState } from '../engine/animations';
import { render } from '../engine/canvasRenderer';
import { useHistory } from '../hooks/useHistory';

export function PreviewArea() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const config = useConfigStore();
  const fontStatus = useFontLoader(config.fontFamily);
  const { addItem } = useHistory();
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const backgroundImage =
    config.bgImage && config.background.type === 'image'
      ? { el: config.bgImage, fit: config.background.fit }
      : undefined;

  const configForLoop = {
    text: config.text,
    mode: config.mode,
    animation: config.animation,
    speed: config.speed,
    loopCount: config.loopCount,
    fontFamily: config.fontFamily,
    fontSize: config.fontSize,
    color: config.color,
    bold: config.bold,
    stroke: config.stroke,
    shadow: config.shadow,
    background: config.background,
    canvasSize: config.canvasSize,
    customSize: config.customSize,
  };
  useAnimationLoop(canvasRef, { ...configForLoop, backgroundImage });

  const size =
    config.canvasSize === 'custom' ? config.customSize : config.canvasSize;

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setExporting(true);
    setProgress(0);

    if (config.mode === 'png') {
      exportPng(canvas, (blob, filename) => {
        triggerDownload(blob, filename);
        addItem({
          thumbnail: canvas.toDataURL('image/png'),
          textPreview: config.text.slice(0, 20),
          config: configForLoop,
        });
        setExporting(false);
      });
    } else {
      const fps = 20;
      const cycleDuration = 2;
      const totalCycles = config.loopCount === 0 ? 1 : config.loopCount;
      const frameCount = fps * cycleDuration * totalCycles;
      const delay = 1000 / fps;

      exportGif({
        canvas,
        frameCount,
        delay,
        renderFrame: (i) => {
          const t = (i / fps) % cycleDuration;
          const animState = getAnimationState(config.animation, t, {
            speed: config.speed,
            charCount: config.text.length,
            totalChars: config.text.length,
          });
          render({
            canvas,
            text: config.text,
            style: {
              fontFamily: config.fontFamily,
              fontSize: config.fontSize,
              color: config.color,
              bold: config.bold,
              stroke: config.stroke,
              shadow: config.shadow,
            },
            background: config.background,
            backgroundImage,
            size,
            animationState: animState,
          });
        },
        onProgress: (p) => setProgress(p),
        onDone: (blob, filename) => {
          triggerDownload(blob, filename);
          addItem({
            thumbnail: canvas.toDataURL('image/png'),
            textPreview: config.text.slice(0, 20),
            config: configForLoop,
          });
          setExporting(false);
        },
        workerScriptPath: '/workers/gif.worker.js',
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="border border-gray-200"
          style={{ maxWidth: '100%', imageRendering: 'pixelated' }}
        />
        <div className="mt-1 text-center text-xs text-gray-400">
          {size.width} × {size.height}
          {fontStatus === 'loading' && ' · 字体加载中...'}
        </div>
      </div>

      {exporting && (
        <div className="w-full max-w-md">
          <div className="h-2 overflow-hidden rounded bg-gray-200">
            <div
              className="h-full bg-blue-500 transition-all"
              style={{ width: `${Math.round(progress * 100)}%` }}
            />
          </div>
          <p className="mt-1 text-center text-xs text-gray-500">
            生成中... {Math.round(progress * 100)}%
          </p>
        </div>
      )}

      <button
        className="rounded bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        disabled={exporting || !config.text}
        onClick={handleDownload}
      >
        {exporting ? '生成中...' : `下载 ${config.mode.toUpperCase()}`}
      </button>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
