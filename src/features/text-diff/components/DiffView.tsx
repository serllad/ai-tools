import { useEffect, useState } from 'react';
import { useDiffStore } from '../store/useDiffStore';
import { DiffPane } from './DiffPane';
import { useScrollSync } from '../hooks/useScrollSync';
import { isIdentical } from '../lib/stats';

export function DiffView() {
  const result = useDiffStore(s => s.result);
  const status = useDiffStore(s => s.status);
  const languageOverride = useDiffStore(s => s.languageOverride);
  const currentAnchor = useDiffStore(s => s.currentAnchor);
  const left = useDiffStore(s => s.left);
  const right = useDiffStore(s => s.right);
  const setLeft = useDiffStore(s => s.setLeft);
  const setRight = useDiffStore(s => s.setRight);
  const nextDiff = useDiffStore(s => s.nextDiff);
  const prevDiff = useDiffStore(s => s.prevDiff);

  const { attach } = useScrollSync();
  const [leftScroller, setLeftScroller] = useState<HTMLElement | null>(null);
  const [rightScroller, setRightScroller] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!leftScroller || !rightScroller) return;
    const detach = attach(leftScroller, rightScroller);
    return detach;
  }, [attach, leftScroller, rightScroller]);

  const canNav = !!result && result.diffAnchors.length > 0;
  const activeIdx = result && currentAnchor >= 0 ? result.diffAnchors[currentAnchor] : null;
  const identical = result ? isIdentical(result) : false;

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      <div className="flex justify-between items-center px-3 py-1 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <span className="text-xs text-gray-500">
          {status === 'comparing' ? '正在对比…' : identical ? '✓ 内容完全相同' : '并排对比（可直接编辑）'}
        </span>
        <div className="flex gap-1">
          <button
            onClick={prevDiff}
            disabled={!canNav || currentAnchor <= 0}
            className="px-2 py-0.5 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="上一处差异"
          >↑ 上一处</button>
          <button
            onClick={nextDiff}
            disabled={!canNav || currentAnchor >= (result?.diffAnchors.length ?? 0) - 1}
            className="px-2 py-0.5 text-sm rounded border border-gray-300 dark:border-gray-600 disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-gray-700"
            title="下一处差异"
          >↓ 下一处</button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex overflow-hidden">
        <div className="flex-1 border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0">
          <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            原始文本 · 字符 {left.length} · 行 {left ? left.split('\n').length : 0}
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <DiffPane
              side="left"
              value={left}
              onChange={setLeft}
              lines={result?.lines ?? []}
              languageOverride={languageOverride}
              activeLineIndex={activeIdx}
              onScrollerReady={setLeftScroller}
            />
          </div>
        </div>
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            修改后文本 · 字符 {right.length} · 行 {right ? right.split('\n').length : 0}
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <DiffPane
              side="right"
              value={right}
              onChange={setRight}
              lines={result?.lines ?? []}
              languageOverride={languageOverride}
              activeLineIndex={activeIdx}
              onScrollerReady={setRightScroller}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
