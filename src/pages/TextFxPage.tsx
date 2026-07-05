import { useState } from 'react';
import { useConfigStore } from '../features/text-fx/store/configStore';
import { ConfigPanel } from '../features/text-fx/components/ConfigPanel';
import { PreviewArea } from '../features/text-fx/components/PreviewArea';
import { HistoryDrawer } from '../features/text-fx/components/HistoryDrawer';
import { useHistory } from '../features/text-fx/hooks/useHistory';
import type { HistoryItem } from '../features/text-fx/types';

export default function TextFxPage() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const { items, removeItem } = useHistory();

  const handleRestore = (item: HistoryItem) => {
    useConfigStore.setState({ ...item.config });
    setHistoryOpen(false);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-gray-50 dark:bg-gray-900">
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <aside className="order-2 w-full overflow-y-auto md:order-1 md:w-96 md:border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">配置</h2>
            <button
              className="rounded px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
              onClick={() => setHistoryOpen(true)}
            >
              历史记录 ({items.length})
            </button>
          </div>
          <ConfigPanel />
        </aside>
        <main className="order-1 flex flex-1 items-start justify-center p-4 md:order-2 md:sticky md:top-0 bg-gray-50 dark:bg-gray-900">
          <PreviewArea />
        </main>
      </div>

      <HistoryDrawer
        open={historyOpen}
        items={items}
        onRestore={handleRestore}
        onRemove={removeItem}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}
