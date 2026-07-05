import { useState } from 'react';
import type { FontFamily, StrokeConfig, ShadowConfig } from '../types';

interface TextStyleProps {
  fontFamily: FontFamily;
  fontSize: number;
  color: string;
  bold: boolean;
  stroke: StrokeConfig;
  shadow: ShadowConfig;
  onFontFamilyChange: (f: FontFamily) => void;
  onFontSizeChange: (n: number) => void;
  onColorChange: (c: string) => void;
  onBoldChange: (b: boolean) => void;
  onStrokeChange: (s: StrokeConfig) => void;
  onShadowChange: (s: ShadowConfig) => void;
}

const FONTS: { value: FontFamily; label: string }[] = [
  { value: 'system', label: '系统默认' },
  { value: 'noto-sans-sc', label: '思源黑体' },
  { value: 'noto-serif-sc', label: '思源宋体' },
  { value: 'zcool-kuaiLe', label: '站酷快乐体' },
  { value: 'zcool-kuaiLe-title', label: '优设标题黑' },
  { value: 'lxgw-wenkai', label: '霞鹜文楷' },
  { value: 'ma-shan-zheng', label: '马善政书法' },
  { value: 'liu-jian-mao-cao', label: '涂鸦手写' },
  { value: 'long-cang', label: '行草飞舞' },
  { value: 'zhi-mang-xing', label: '狂草书法' },
  { value: 'zcool-xiaowei', label: '站酷小薇' },
];

const PRESET_COLORS = [
  '#ffffff', '#000000', '#e63946', '#ffd700',
  '#ff6b9d', '#06d6a0', '#118ab2', '#9d4edd',
];

export function TextStyle(props: TextStyleProps) {
  const [showStroke, setShowStroke] = useState(props.stroke.enabled);
  const [showShadow, setShowShadow] = useState(props.shadow.enabled);

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">字体</label>
        <select
          className="w-full rounded border border-gray-300 p-2 text-sm"
          value={props.fontFamily}
          onChange={(e) => props.onFontFamilyChange(e.target.value as FontFamily)}
        >
          {FONTS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          字号: {props.fontSize}px
        </label>
        <input
          type="range"
          min={24}
          max={120}
          step={1}
          value={props.fontSize}
          onChange={(e) => props.onFontSizeChange(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">文字颜色</label>
        <div className="flex flex-wrap gap-1">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              className={`h-7 w-7 rounded border-2 ${
                props.color === c ? 'border-blue-500' : 'border-gray-200'
              }`}
              style={{ backgroundColor: c }}
              onClick={() => props.onColorChange(c)}
            />
          ))}
          <input
            type="color"
            value={props.color}
            onChange={(e) => props.onColorChange(e.target.value)}
            className="h-7 w-7 cursor-pointer rounded border border-gray-200"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={props.bold}
          onChange={(e) => props.onBoldChange(e.target.checked)}
        />
        加粗
      </label>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showStroke}
            onChange={(e) => {
              setShowStroke(e.target.checked);
              props.onStrokeChange({ ...props.stroke, enabled: e.target.checked });
            }}
          />
          描边
        </label>
        {showStroke && (
          <div className="ml-6 flex items-center gap-2">
            <input
              type="range"
              min={1}
              max={8}
              value={props.stroke.width}
              onChange={(e) =>
                props.onStrokeChange({ ...props.stroke, width: Number(e.target.value) })
              }
            />
            <input
              type="color"
              value={props.stroke.color}
              onChange={(e) =>
                props.onStrokeChange({ ...props.stroke, color: e.target.value })
              }
              className="h-6 w-6 cursor-pointer"
            />
          </div>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={showShadow}
            onChange={(e) => {
              setShowShadow(e.target.checked);
              props.onShadowChange({ ...props.shadow, enabled: e.target.checked });
            }}
          />
          阴影
        </label>
        {showShadow && (
          <div className="ml-6 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">模糊</span>
              <input
                type="range"
                min={0}
                max={20}
                value={props.shadow.blur}
                onChange={(e) =>
                  props.onShadowChange({ ...props.shadow, blur: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">X 偏移</span>
              <input
                type="range"
                min={-10}
                max={10}
                value={props.shadow.offsetX}
                onChange={(e) =>
                  props.onShadowChange({ ...props.shadow, offsetX: Number(e.target.value) })
                }
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Y 偏移</span>
              <input
                type="range"
                min={-10}
                max={10}
                value={props.shadow.offsetY}
                onChange={(e) =>
                  props.onShadowChange({ ...props.shadow, offsetY: Number(e.target.value) })
                }
              />
            </div>
            <input
              type="color"
              value={props.shadow.color}
              onChange={(e) =>
                props.onShadowChange({ ...props.shadow, color: e.target.value })
              }
              className="h-6 w-6 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
}
