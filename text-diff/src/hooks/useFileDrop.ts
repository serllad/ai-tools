import type { Side } from '../types';
import { useDiffStore } from '../store/useDiffStore';

const TEXT_EXT = ['.txt','.json','.xml','.md','.log','.yml','.yaml','.csv','.html','.css','.js','.ts','.py','.sh','.sql'];
const MAX_SIZE = 2 * 1024 * 1024;

export function useFileDrop() {
  async function onDrop(file: File, side: Side): Promise<void> {
    const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
    const isText = TEXT_EXT.includes(ext) || file.type.startsWith('text/');
    if (!isText) {
      useDiffStore.getState().setLastError('仅支持文本文件（.txt .json .md 等）');
      return;
    }
    let text: string;
    if (typeof file.text === 'function') {
      text = await file.text();
    } else {
      // jsdom fallback: File.text() is not implemented, use FileReader
      text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
    }
    if (side === 'left') useDiffStore.getState().setLeft(text);
    else useDiffStore.getState().setRight(text);
    if (file.size > MAX_SIZE) {
      const mb = (file.size / 1024 / 1024).toFixed(1);
      useDiffStore.getState().setLastError(`文件较大（${mb} MB），加载和对比可能需要几秒钟`);
    }
  }
  return { onDrop };
}
