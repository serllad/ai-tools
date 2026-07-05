export function exportPng(
  canvas: HTMLCanvasElement,
  onDone: (blob: Blob, filename: string) => void,
): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const filename = `textfx_${Date.now()}.png`;
    onDone(blob, filename);
  }, 'image/png');
}
