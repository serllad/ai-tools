import type { OutputMode } from '../types';

interface ModeSwitchProps {
  value: OutputMode;
  onChange: (m: OutputMode) => void;
}

export function ModeSwitch({ value, onChange }: ModeSwitchProps) {
  const modes: { key: OutputMode; label: string }[] = [
    { key: 'gif', label: 'GIF' },
    { key: 'png', label: 'PNG' },
  ];
  return (
    <div className="flex gap-2">
      {modes.map((m) => (
        <button
          key={m.key}
          className={`flex-1 rounded px-4 py-2 text-sm font-medium transition ${
            value === m.key
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
          onClick={() => onChange(m.key)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
