import { useEffect, useRef } from 'react';
import { useDiffStore } from '../store/useDiffStore';

const DEBOUNCE_MS = 500;
const LINE_LIMIT = 5000;

export function useAutoCompare(): void {
  const left = useDiffStore(s => s.left);
  const right = useDiffStore(s => s.right);
  const autoCompare = useDiffStore(s => s.autoCompare);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!autoCompare) return;
    if (!left && !right) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const leftLines = left ? left.split('\n').length : 0;
      const rightLines = right ? right.split('\n').length : 0;
      if (leftLines > LINE_LIMIT || rightLines > LINE_LIMIT) {
        useDiffStore.getState().setLastError('内容较大（超过 5000 行），已切换为手动对比，点击对比按钮继续');
        return;
      }
      useDiffStore.getState().compare();
    }, DEBOUNCE_MS);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [left, right, autoCompare]);
}
