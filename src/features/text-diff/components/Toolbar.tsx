import { useState } from 'react';
import { useDiffStore } from '../store/useDiffStore';
import { copyText, formatSummary } from '../lib/clipboard';

interface Props {
  onUploadClick: (side: 'left' | 'right') => void;
  onToggleSettings: () => void;
}

export function Toolbar({ onUploadClick, onToggleSettings }: Props) {
  const compare = useDiffStore(s => s.compare);
  const swap = useDiffStore(s => s.swap);
  const clear = useDiffStore(s => s.clear);
  const left = useDiffStore(s => s.left);
  const right = useDiffStore(s => s.right);
  const result = useDiffStore(s => s.result);
  const confirmClear = useDiffStore(s => s.confirmClear);
  const theme = useDiffStore(s => s.theme);
  const setTheme = useDiffStore(s => s.setTheme);

  const [copyOpen, setCopyOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);

  function cycleTheme() {
    const next = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    setTheme(next);
  }

  function handleClear() {
    if (confirmClear && (left || right) && !window.confirm('确定清空两侧内容吗？')) return;
    clear();
  }

  async function doCopy(kind: 'left' | 'right' | 'summary') {
    let text = '';
    if (kind === 'left') text = left;
    else if (kind === 'right') text = right;
    else if (result) text = formatSummary(result);
    const ok = await copyText(text);
    setCopyOpen(false);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex-wrap">
      <button onClick={() => compare()} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">对比</button>
      <button onClick={() => swap()} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm">⇄ 交换</button>
      <div className="relative">
        <button
          onClick={() => setCopyOpen(o => !o)}
          disabled={!left && !right && !result}
          className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm disabled:opacity-40"
        >{copied ? '已复制 ✓' : '📋 复制▾'}</button>
        {copyOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow z-10 w-40">
            <button onClick={() => doCopy('left')} className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">复制左侧内容</button>
            <button onClick={() => doCopy('right')} className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">复制右侧内容</button>
            <button onClick={() => doCopy('summary')} disabled={!result} className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40">复制差异汇总</button>
          </div>
        )}
      </div>
      <button onClick={handleClear} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm">🗑 清除</button>
      <div className="relative">
        <button onClick={() => setUploadOpen(o => !o)} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm">📁 上传</button>
        {uploadOpen && (
          <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow z-10 w-32">
            <button onClick={() => { setUploadOpen(false); onUploadClick('left'); }} className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">上传到左侧</button>
            <button onClick={() => { setUploadOpen(false); onUploadClick('right'); }} className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">上传到右侧</button>
          </div>
        )}
      </div>
      <button onClick={onToggleSettings} className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm">⚙</button>
      <button onClick={cycleTheme} className="ml-auto px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm">
        {theme === 'light' ? '☀️ 浅色' : theme === 'dark' ? '🌙 深色' : '🖥 跟随系统'}
      </button>
    </div>
  );
}
