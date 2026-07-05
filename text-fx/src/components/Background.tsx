import { useRef, useState } from 'react';
import type { BackgroundConfig, ImageFit } from '../types';

interface BackgroundProps {
  value: BackgroundConfig;
  onChange: (b: BackgroundConfig) => void;
  imageUrl: string | null;
  onUpload: (file: File) => void;
  onClear: () => void;
  onFitChange: (fit: ImageFit) => void;
}

const PRESET_COLORS = [
  '#1a1a2e', '#16213e', '#e63946', '#ffd6a5',
  '#06d6a0', '#118ab2', '#9d4edd', '#ffffff',
];

type Tab = 'solid' | 'gradient' | 'transparent' | 'image';

const FIT_LABELS: Record<ImageFit, string> = {
  cover: '覆盖',
  contain: '包含',
  stretch: '拉伸',
};

export function Background({
  value,
  onChange,
  imageUrl,
  onUpload,
  onClear,
  onFitChange,
}: BackgroundProps) {
  const initialTab: Tab = value.type;
  const [tab, setTab] = useState<Tab>(initialTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {(['solid', 'gradient', 'transparent', 'image'] as Tab[]).map((t) => (
          <button
            key={t}
            className={`flex-1 rounded px-2 py-1 text-xs ${
              tab === t ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
            }`}
            onClick={() => {
              setTab(t);
              if (t === 'solid') onChange({ type: 'solid', color: PRESET_COLORS[0] });
              else if (t === 'gradient')
                onChange({
                  type: 'gradient',
                  color1: '#667eea',
                  color2: '#764ba2',
                  direction: 'horizontal',
                });
              else if (t === 'transparent') onChange({ type: 'transparent' });
              else onChange({ type: 'image', fit: 'cover' });
            }}
          >
            {t === 'solid'
              ? '纯色'
              : t === 'gradient'
                ? '渐变'
                : t === 'transparent'
                  ? '透明'
                  : '图片'}
          </button>
        ))}
      </div>

      {tab === 'solid' && value.type === 'solid' && (
        <div className="flex flex-wrap gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              className={`h-7 w-7 rounded border-2 ${
                value.color === c ? 'border-blue-500' : 'border-gray-200'
              }`}
              style={{ backgroundColor: c }}
              onClick={() => onChange({ type: 'solid', color: c })}
            />
          ))}
          <input
            type="color"
            value={value.color}
            onChange={(e) => onChange({ type: 'solid', color: e.target.value })}
            className="h-7 w-7 cursor-pointer rounded border border-gray-200"
          />
        </div>
      )}

      {tab === 'gradient' && value.type === 'gradient' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">起始色</span>
            <input
              type="color"
              value={value.color1}
              onChange={(e) => onChange({ ...value, color1: e.target.value })}
              className="h-6 w-6 cursor-pointer"
            />
            <span className="text-xs text-gray-500">结束色</span>
            <input
              type="color"
              value={value.color2}
              onChange={(e) => onChange({ ...value, color2: e.target.value })}
              className="h-6 w-6 cursor-pointer"
            />
          </div>
          <div className="flex gap-1">
            {(['horizontal', 'vertical', 'diagonal'] as const).map((d) => (
              <button
                key={d}
                className={`flex-1 rounded px-2 py-1 text-xs ${
                  value.direction === d ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700'
                }`}
                onClick={() => onChange({ ...value, direction: d })}
              >
                {d === 'horizontal' ? '水平' : d === 'vertical' ? '垂直' : '对角'}
              </button>
            ))}
          </div>
        </div>
      )}

      {tab === 'transparent' && (
        <p className="text-xs text-gray-500">导出时背景透明</p>
      )}

      {tab === 'image' && (
        <div className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = '';
            }}
          />

          {imageUrl ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <img
                  src={imageUrl}
                  alt="底图预览"
                  className="h-16 w-16 rounded border border-gray-200 object-cover"
                />
                <button
                  className="rounded bg-gray-100 px-3 py-1 text-xs text-gray-700 hover:bg-gray-200"
                  onClick={onClear}
                >
                  移除
                </button>
              </div>
              <div className="flex gap-1">
                {(['cover', 'contain', 'stretch'] as ImageFit[]).map((f) => (
                  <button
                    key={f}
                    className={`flex-1 rounded px-2 py-1 text-xs ${
                      value.type === 'image' && value.fit === f
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                    onClick={() => onFitChange(f)}
                  >
                    {FIT_LABELS[f]}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <button
              className="w-full rounded border border-dashed border-gray-300 px-3 py-4 text-xs text-gray-500 hover:border-blue-400 hover:text-blue-500"
              onClick={() => fileInputRef.current?.click()}
            >
              点击上传底图
            </button>
          )}
        </div>
      )}
    </div>
  );
}
