import { useState } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { PreviewArea } from './components/PreviewArea';
import { HistoryDrawer } from './components/HistoryDrawer';
import { useConfigStore } from './store/configStore';
import { useHistory } from './hooks/useHistory';
import type { HistoryItem } from './types';

export default function App() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const { items, removeItem } = useHistory();
  // const applyPreset = useConfigStore((s) => s.applyPreset);

  const handleRestore = (item: HistoryItem) => {
    useConfigStore.setState({ ...item.config });
    setHistoryOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold">TextFX 文字特效生成器</h1>
          <button
            className="rounded px-3 py-1 text-sm text-blue-600 hover:bg-blue-50"
            onClick={() => setHistoryOpen(true)}
          >
            历史记录 ({items.length})
          </button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        <aside className="order-2 w-full overflow-y-auto md:order-1 md:w-96 md:border-r">
          <ConfigPanel />
        </aside>
        <main className="order-1 flex flex-1 items-start justify-center p-4 md:order-2 md:sticky md:top-0">
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
