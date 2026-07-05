import type { AnimationType } from '../types';

interface AnimationPickerProps {
  value: AnimationType;
  onChange: (a: AnimationType) => void;
}

const OPTIONS: { key: AnimationType; label: string }[] = [
  { key: 'typewriter', label: '打字机' },
  { key: 'fade', label: '渐现渐隐' },
  { key: 'blink', label: '闪烁' },
  { key: 'bounce', label: '弹跳' },
  { key: 'heartbeat', label: '心跳' },
  { key: 'rainbow', label: '彩虹变色' },
  { key: 'wave', label: '波浪' },
  { key: 'slide', label: '滑入' },
  { key: 'rotate', label: '旋转' },
  { key: 'flip', label: '翻转' },
  { key: 'shake', label: '抖动' },
  { key: 'pulse', label: '脉冲' },
  { key: 'neon', label: '霓虹' },
  { key: 'drop', label: '坠落' },
];

export function AnimationPicker({ value, onChange }: AnimationPickerProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          className={`rounded border p-2 text-xs transition ${
            value === o.key
              ? 'border-blue-500 bg-blue-50 text-blue-600 ring-2 ring-blue-500'
              : 'border-gray-200 hover:border-gray-300'
          }`}
          onClick={() => onChange(o.key)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
