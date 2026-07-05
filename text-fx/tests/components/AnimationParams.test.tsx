import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnimationParams } from '../../src/components/AnimationParams';

describe('AnimationParams', () => {
  it('renders speed options', () => {
    render(
      <AnimationParams
        speed={1}
        loopCount={0}
        mode="gif"
        onSpeedChange={() => {}}
        onLoopCountChange={() => {}}
      />,
    );
    expect(screen.getByText('播放速度')).toBeInTheDocument();
  });

  it('renders loop options', () => {
    render(
      <AnimationParams
        speed={1}
        loopCount={0}
        mode="gif"
        onSpeedChange={() => {}}
        onLoopCountChange={() => {}}
      />,
    );
    expect(screen.getByText('无限循环')).toBeInTheDocument();
  });

  it('disables controls in PNG mode', () => {
    render(
      <AnimationParams
        speed={1}
        loopCount={0}
        mode="png"
        onSpeedChange={() => {}}
        onLoopCountChange={() => {}}
      />,
    );
    expect(screen.getByText('0.5x').closest('button')).toBeDisabled();
  });

  it('calls onSpeedChange on click', async () => {
    const onSpeedChange = vi.fn();
    render(
      <AnimationParams
        speed={1}
        loopCount={0}
        mode="gif"
        onSpeedChange={onSpeedChange}
        onLoopCountChange={() => {}}
      />,
    );
    await userEvent.click(screen.getByText('1.5x'));
    expect(onSpeedChange).toHaveBeenCalledWith(1.5);
  });
});
