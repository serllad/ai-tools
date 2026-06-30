interface Props {
  onFormat: () => void;
  onCompress: () => void;
  onUnwrap: () => void;
  onDecodeUnicode: () => void;
  onDecodeUrls: () => void;
  onCopy: () => void;
  onClear: () => void;
  onToggleHistory: () => void;
  onUploadClick: () => void;
  onToggleSettings: () => void;
  onToggleTheme: () => void;
  canFormat: boolean;
  canCopy: boolean;
  copied: boolean;
  historyCount: number;
}

export function Toolbar({
  onFormat, onCompress, onUnwrap, onDecodeUnicode, onDecodeUrls, onCopy, onClear, onToggleHistory, onUploadClick, onToggleSettings, onToggleTheme,
  canFormat, canCopy, copied, historyCount
}: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <button onClick={onFormat} disabled={!canFormat} className="px-3 py-1 text-sm bg-blue-600 text-white rounded disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-700">
        格式化
      </button>
      <button onClick={onCompress} disabled={!canFormat} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600">
        压缩
      </button>
      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button onClick={onUnwrap} disabled={!canFormat} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600">
        去转义
      </button>
      <button onClick={onDecodeUnicode} disabled={!canFormat} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600">
        Unicode 解码
      </button>
      <button onClick={onDecodeUrls} disabled={!canFormat} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600">
        URL 解码
      </button>
      <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1" />
      <button onClick={onCopy} disabled={!canCopy} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-40 hover:bg-gray-300 dark:hover:bg-gray-600">
        {copied ? '已复制 ✓' : '复制'}
      </button>
      <button onClick={onClear} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
        清除
      </button>
      <button onClick={onUploadClick} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
        📁 上传
      </button>
      <button onClick={onToggleHistory} className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 relative">
        ⏳ 历史
        {historyCount > 0 && (
          <span className="ml-1 inline-flex items-center justify-center w-4 h-4 text-xs bg-blue-600 text-white rounded-full">{historyCount}</span>
        )}
      </button>
      <button onClick={onToggleSettings} aria-label="设置" className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
        ⚙
      </button>
      <button onClick={onToggleTheme} aria-label="切换主题" className="ml-auto px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600">
        🌙
      </button>
    </div>
  );
}
