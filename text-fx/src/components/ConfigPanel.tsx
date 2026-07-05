import { useState } from 'react';
import { useConfigStore } from '../store/configStore';
import { TextInput } from './TextInput';
import { ModeSwitch } from './ModeSwitch';
import { AnimationPicker } from './AnimationPicker';
import { AnimationParams } from './AnimationParams';
import { TextStyle } from './TextStyle';
import { Background } from './Background';
import { CanvasSize } from './CanvasSize';
import { PresetTemplates } from './PresetTemplates';

function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 py-3">
      <button
        className="flex w-full items-center justify-between text-sm font-medium text-gray-700 md:cursor-default"
        onClick={() => setOpen(!open)}
      >
        {title}
        <span className="md:hidden">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  );
}

export function ConfigPanel() {
  const c = useConfigStore();

  return (
    <div className="space-y-0 px-4 py-2">
      <Section title="文字内容">
        <TextInput value={c.text} onChange={c.setText} />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">输出模式</label>
          <ModeSwitch value={c.mode} onChange={c.setMode} />
        </div>
      </Section>

      <Section title="动画效果">
        <AnimationPicker value={c.animation} onChange={c.setAnimation} />
        <AnimationParams
          speed={c.speed}
          loopCount={c.loopCount}
          mode={c.mode}
          onSpeedChange={c.setSpeed}
          onLoopCountChange={c.setLoopCount}
        />
      </Section>

      <Section title="文字样式">
        <TextStyle
          fontFamily={c.fontFamily}
          fontSize={c.fontSize}
          color={c.color}
          bold={c.bold}
          stroke={c.stroke}
          shadow={c.shadow}
          onFontFamilyChange={c.setFontFamily}
          onFontSizeChange={c.setFontSize}
          onColorChange={c.setColor}
          onBoldChange={c.setBold}
          onStrokeChange={c.setStroke}
          onShadowChange={c.setShadow}
        />
      </Section>

      <Section title="背景设置">
        <Background
          value={c.background}
          onChange={c.setBackground}
          imageUrl={c.bgImageUrl}
          onUpload={c.setBgImage}
          onClear={c.clearBgImage}
          onFitChange={c.setBgImageFit}
        />
      </Section>

      <Section title="画布尺寸">
        <CanvasSize
          canvasSize={c.canvasSize}
          customSize={c.customSize}
          onCanvasSizeChange={c.setCanvasSize}
          onCustomSizeChange={c.setCustomSize}
        />
      </Section>

      <Section title="预设模板" defaultOpen={false}>
        <PresetTemplates onApply={c.applyPreset} />
      </Section>
    </div>
  );
}
