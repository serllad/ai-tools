import type { Stats, CompressInfo } from '../types';

export function computeStats(text: string): Stats {
  if (text.length === 0) {
    return { chars: 0, lines: 0, sizeBytes: 0 };
  }
  const chars = text.length;
  const lines = text.split('\n').length;
  const sizeBytes = new Blob([text]).size;
  return { chars, lines, sizeBytes };
}

export function computeCompressInfo(inputBytes: number, outputBytes: number): CompressInfo | null {
  if (inputBytes === 0) return null;
  const ratio = outputBytes / inputBytes;
  const savedBytes = inputBytes - outputBytes;
  return { ratio, savedBytes };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
