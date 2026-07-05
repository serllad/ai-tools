import { PRESETS } from '../store/configStore';
import type { Preset } from '../types';

interface PresetTemplatesProps {
  onApply: (p: Preset) => void;
}

export function PresetTemplates({ onApply }: PresetTemplatesProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {PRESETS.map((p) => (
        <button key={p.name} className="rounded border border-gray-200 p-2 text-xs hover:border-blue-400 hover:bg-blue-50" onClick={() => onApply(p)}>{p.name}</button>
      ))}
    </div>
  );
}
