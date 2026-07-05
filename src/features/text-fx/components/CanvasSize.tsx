import type { ConfigState } from '../types';

interface CanvasSizeProps {
  canvasSize: ConfigState['canvasSize'];
  customSize: { width: number; height: number };
  onCanvasSizeChange: (s: ConfigState['canvasSize']) => void;
  onCustomSizeChange: (s: { width: number; height: number }) => void;
}

const PRESETS = [
  { label: '横版通用', width: 500, height: 200 },
  { label: '横版大尺寸', width: 800, height: 600 },
  { label: '1:1 方形', width: 500, height: 500 },
  { label: '9:16 竖版', width: 500, height: 889 },
];

export function CanvasSize({ canvasSize, customSize, onCanvasSizeChange, onCustomSizeChange }: CanvasSizeProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1">
        {PRESETS.map((p) => {
          const active = canvasSize !== 'custom' && canvasSize.width === p.width && canvasSize.height === p.height;
          return (
            <button key={p.label} className={`rounded border px-2 py-1 text-xs ${active ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 hover:border-gray-300'}`} onClick={() => { onCanvasSizeChange({ width: p.width, height: p.height }); onCustomSizeChange({ width: p.width, height: p.height }); }}>
              {p.label}<span className="block text-[10px] text-gray-400">{p.width}x{p.height}</span>
            </button>
          );
        })}
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="radio" checked={canvasSize === 'custom'} onChange={() => onCanvasSizeChange('custom')} />自定义
      </label>
      {canvasSize === 'custom' && (
        <div className="flex items-center gap-2">
          <input type="number" min={50} max={2000} value={customSize.width} onChange={(e) => onCustomSizeChange({ ...customSize, width: Number(e.target.value) })} className="w-20 rounded border border-gray-300 p-1 text-sm" />
          <span>x</span>
          <input type="number" min={50} max={2000} value={customSize.height} onChange={(e) => onCustomSizeChange({ ...customSize, height: Number(e.target.value) })} className="w-20 rounded border border-gray-300 p-1 text-sm" />
        </div>
      )}
    </div>
  );
}
