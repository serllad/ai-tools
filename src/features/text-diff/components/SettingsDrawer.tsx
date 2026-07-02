import { useDiffStore } from '../store/useDiffStore';
import type { LanguageId } from '../lib/languageDetect';

const LANGS: LanguageId[] = ['text','json','xml','html','javascript','css','python','markdown','yaml','sql'];

interface Props { open: boolean; onClose: () => void; }

export function SettingsDrawer({ open, onClose }: Props) {
  const autoCompare = useDiffStore(s => s.autoCompare);
  const confirmClear = useDiffStore(s => s.confirmClear);
  const granularity = useDiffStore(s => s.granularity);
  const languageOverride = useDiffStore(s => s.languageOverride);
  const setAutoCompare = useDiffStore(s => s.setAutoCompare);
  const setConfirmClear = useDiffStore(s => s.setConfirmClear);
  const setGranularity = useDiffStore(s => s.setGranularity);
  const setLanguageOverride = useDiffStore(s => s.setLanguageOverride);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div className="relative w-80 bg-white dark:bg-gray-900 p-4 overflow-auto" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">设置</h2>
        <label className="flex items-center justify-between py-2">
          <span>自动对比</span>
          <input type="checkbox" checked={autoCompare} onChange={e => setAutoCompare(e.target.checked)} />
        </label>
        <label className="flex items-center justify-between py-2">
          <span>清除前确认</span>
          <input type="checkbox" checked={confirmClear} onChange={e => setConfirmClear(e.target.checked)} />
        </label>
        <div className="py-2">
          <div className="mb-1">对比精度</div>
          <select value={granularity} onChange={e => setGranularity(e.target.value as 'char' | 'word')} className="w-full border border-gray-300 dark:border-gray-600 bg-transparent rounded px-2 py-1">
            <option value="char">逐字</option>
            <option value="word">逐词</option>
          </select>
        </div>
        <div className="py-2">
          <div className="mb-1">语言（覆盖自动检测）</div>
          <select
            value={languageOverride ?? 'auto'}
            onChange={e => setLanguageOverride(e.target.value === 'auto' ? null : (e.target.value as LanguageId))}
            className="w-full border border-gray-300 dark:border-gray-600 bg-transparent rounded px-2 py-1"
          >
            <option value="auto">自动检测</option>
            {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <button onClick={onClose} className="mt-4 w-full py-2 border border-gray-300 dark:border-gray-600 rounded">关闭</button>
      </div>
    </div>
  );
}
