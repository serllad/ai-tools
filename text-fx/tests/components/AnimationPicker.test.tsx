import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnimationPicker } from '../../src/components/AnimationPicker';
import type { AnimationType } from '../../src/types';

describe('AnimationPicker', () => {
  const labels: Record<AnimationType, string> = {
    typewriter: '打字机',
    fade: '渐现渐隐',
    blink: '闪烁',
    bounce: '弹跳',
    heartbeat: '心跳',
    rainbow: '彩虹变色',
    wave: '波浪',
    slide: '滑入',
    rotate: '旋转',
    flip: '翻转',
    shake: '抖动',
    pulse: '脉冲',
    neon: '霓虹',
    drop: '坠落',
  };

  it('renders all 14 animation options', () => {
    render(<AnimationPicker value="typewriter" onChange={() => {}} />);
    Object.values(labels).forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('highlights selected animation', () => {
    render(<AnimationPicker value="blink" onChange={() => {}} />);
    expect(screen.getByText('闪烁').className).toContain('ring-2');
  });

  it('calls onChange on click', async () => {
    const onChange = vi.fn();
    render(<AnimationPicker value="typewriter" onChange={onChange} />);
    await userEvent.click(screen.getByText('波浪'));
    expect(onChange).toHaveBeenCalledWith('wave');
  });
});
