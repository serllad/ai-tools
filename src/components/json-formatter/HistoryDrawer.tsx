import type { HistoryItem } from '../../types';
import { formatBytes } from '../../lib/stats';

interface Props {
  open: boolean;
  items: HistoryItem[];
  onLoad: (item: HistoryItem) => void;
  onRemove: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

export function HistoryDrawer({ open, items, onLoad, onRemove, onClearAll, onClose }: Props) {
  if (!open) return null;
  return (
    <div data-testid="history-drawer" className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-gray-900 shadow-lg border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-sm font-medium">历史记录（{items.length}/5）</h2>
        <button onClick={onClose} aria-label="关闭" className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">✕</button>
      </div>
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="p-4 text-sm text-gray-500">暂无历史记录</div>
        ) : (
          <ul>
            {items.map(item => (
              <li key={item.id} className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <div className="text-xs text-gray-400 mb-1">
                  {new Date(item.createdAt).toLocaleString()} · {formatBytes(item.sizeBytes)}
                </div>
                <div className="text-sm font-mono break-all mb-1">{item.summary}</div>
                <div className="flex gap-2">
                  <button onClick={() => onLoad(item)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">恢复</button>
                  <button onClick={() => onRemove(item.id)} className="text-xs text-red-600 dark:text-red-400 hover:underline">删除</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {items.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClearAll} className="text-xs text-red-600 dark:text-red-400 hover:underline">全部清除</button>
        </div>
      )}
    </div>
  );
}
