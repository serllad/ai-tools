import GIF from 'gif.js';

interface ExportGifParams {
  canvas: HTMLCanvasElement;
  frameCount: number;
  delay: number;
  renderFrame: (frameIndex: number) => void;
  onProgress: (p: number) => void;
  onDone: (blob: Blob, filename: string) => void;
  workerScriptPath: string;
}

export function exportGif(params: ExportGifParams): void {
  const { canvas, frameCount, delay, renderFrame, onProgress, onDone, workerScriptPath } = params;
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: canvas.width,
    height: canvas.height,
    workerScript: workerScriptPath,
    transparent: 0x00000000,
  });
  gif.on('progress', (p: number) => onProgress(p));
  gif.on('finished', (blob: Blob) => {
    const filename = `textfx_${Date.now()}.gif`;
    onDone(blob, filename);
  });
  for (let i = 0; i < frameCount; i++) {
    renderFrame(i);
    gif.addFrame(canvas, { copy: true, delay });
  }
  gif.render();
}
