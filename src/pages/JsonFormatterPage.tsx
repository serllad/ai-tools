import { useState } from 'react';
import { useJsonStore } from '../store/useJsonStore';
import { useAutoFormat } from '../hooks/useAutoFormat';
import { useKeyboard } from '../hooks/useKeyboard';
import { useFileDrop } from '../hooks/useFileDrop';
import { Toolbar } from '../components/json-formatter/Toolbar';
import { Editor } from '../components/json-formatter/Editor';
import { Output } from '../components/json-formatter/Output';
import { StatusBar } from '../components/json-formatter/StatusBar';
import { ErrorBanner } from '../components/json-formatter/ErrorBanner';
import { HistoryDrawer } from '../components/json-formatter/HistoryDrawer';

export default function JsonFormatterPage() {
  useAutoFormat();
  useKeyboard();
  const { onDrop } = useFileDrop();

  const input = useJsonStore(s => s.input);
  const output = useJsonStore(s => s.output);
  const status = useJsonStore(s => s.status);
  const error = useJsonStore(s => s.error);
  const lastError = useJsonStore(s => s.lastError);
  const stats = useJsonStore(s => s.stats);
  const compressInfo = useJsonStore(s => s.compressInfo);
  const history = useJsonStore(s => s.history);

  const setInput = useJsonStore(s => s.setInput);
  const format = useJsonStore(s => s.format);
  const compress = useJsonStore(s => s.compress);
  const unwrap = useJsonStore(s => s.unwrap);
  const decodeUnicode = useJsonStore(s => s.decodeUnicode);
  const decodeUrls = useJsonStore(s => s.decodeUrls);
  const clear = useJsonStore(s => s.clear);
  const copy = useJsonStore(s => s.copy);
  const loadHistory = useJsonStore(s => s.loadHistory);
  const removeHistory = useJsonStore(s => s.removeHistory);
  const clearHistory = useJsonStore(s => s.clearHistory);
  const setLastError = useJsonStore(s => s.setLastError);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);

  async function handleCopy() {
    /* copy() in the store already handles clipboard; return bool */
    const ok = await copy();
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function handleClear() {
    const { confirmClear } = useJsonStore.getState();
    if (confirmClear && input && !window.confirm('确定要清空吗？')) return;
    clear();
  }

  function handleUploadClick() {
    fileInputRef?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) void onDrop(f);
    e.target.value = '';
  }

  function handleTheme() {
    /* Theme toggled from App header, not here */
  }

  const canFormat = status === 'valid';
  const canCopy = output.length > 0;

  return (
    <div
      className="flex flex-col h-full"
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) void onDrop(f);
      }}
    >
      <ErrorBanner message={lastError} />
      <Toolbar
        onFormat={format}
        onCompress={compress}
        onUnwrap={unwrap}
        onDecodeUnicode={decodeUnicode}
        onDecodeUrls={decodeUrls}
        onCopy={handleCopy}
        onClear={handleClear}
        onToggleHistory={() => setHistoryOpen(o => !o)}
        onUploadClick={handleUploadClick}
        onToggleSettings={() => setLastError(null)}
        onToggleTheme={handleTheme}
        canFormat={canFormat}
        canCopy={canCopy}
        copied={copied}
        historyCount={history.length}
      />
      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        <div className="flex-1 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
          <Editor value={input} onChange={setInput} error={error} />
        </div>
        <div className="flex-1">
          <Output value={output} />
        </div>
      </div>
      <StatusBar stats={stats} compressInfo={compressInfo} status={status} error={error} />
      <HistoryDrawer
        open={historyOpen}
        items={history}
        onLoad={(item) => { loadHistory(item); setHistoryOpen(false); }}
        onRemove={removeHistory}
        onClearAll={clearHistory}
        onClose={() => setHistoryOpen(false)}
      />
      <input
        ref={setFileInputRef}
        type="file"
        accept=".json,.txt,application/json,text/plain"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
