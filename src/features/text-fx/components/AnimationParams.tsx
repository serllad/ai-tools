import type { OutputMode, Speed, LoopCount } from '../types';

interface AnimationParamsProps {
  speed: Speed;
  loopCount: LoopCount;
  mode: OutputMode;
  onSpeedChange: (s: Speed) => void;
  onLoopCountChange: (l: LoopCount) => void;
}

const SPEEDS: Speed[] = [0.5, 0.75, 1, 1.5, 2];
const LOOPS: { value: LoopCount; label: string }[] = [
  { value: 0, label: '无限循环' },
  { value: 1, label: '1 次' },
  { value: 3, label: '3 次' },
  { value: 5, label: '5 次' },
];

export function AnimationParams({ speed, loopCount, mode, onSpeedChange, onLoopCountChange }: AnimationParamsProps) {
  const disabled = mode === 'png';
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">播放速度</label>
        <div className="flex gap-1">
          {SPEEDS.map((s) => (
            <button key={s} disabled={disabled} className={`flex-1 rounded px-2 py-1 text-xs transition ${speed === s ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`} onClick={() => onSpeedChange(s)}>{s}x</button>
          ))}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">循环次数</label>
        <div className="flex gap-1">
          {LOOPS.map((l) => (
            <button key={l.value} disabled={disabled} className={`flex-1 rounded px-2 py-1 text-xs transition ${loopCount === l.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`} onClick={() => onLoopCountChange(l.value)}>{l.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
