import type { HistoryItem } from '../types';

interface HistoryDrawerProps {
  open: boolean;
  items: HistoryItem[];
  onRestore: (item: HistoryItem) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}

export function HistoryDrawer({ open, items, onRestore, onRemove, onClose }: HistoryDrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <div className="w-80 overflow-y-auto bg-white p-4 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">历史记录</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">X</button>
        </div>
        {items.length === 0 ? (
          <p className="text-xs text-gray-400">暂无记录</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 rounded border border-gray-100 p-2">
                <img src={item.thumbnail} alt={item.textPreview} className="h-10 w-10 rounded border border-gray-200" />
                <div className="flex-1">
                  <p className="truncate text-xs font-medium">{item.textPreview}</p>
                  <p className="text-[10px] text-gray-400">{new Date(item.createdAt).toLocaleString('zh-CN')}</p>
                </div>
                <button className="text-xs text-blue-500 hover:underline" onClick={() => onRestore(item)}>恢复</button>
                <button className="text-xs text-red-400 hover:underline" onClick={() => onRemove(item.id)}>删除</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
