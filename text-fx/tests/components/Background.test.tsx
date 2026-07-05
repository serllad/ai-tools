import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Background } from '../../src/components/Background';
import type { BackgroundConfig } from '../../src/types';

function setup(overrides: Partial<React.ComponentProps<typeof Background>> = {}) {
  const props = {
    value: { type: 'solid', color: '#1a1a2e' } as BackgroundConfig,
    onChange: vi.fn(),
    imageUrl: null,
    onUpload: vi.fn(),
    onClear: vi.fn(),
    onFitChange: vi.fn(),
    ...overrides,
  };
  render(<Background {...props} />);
  return props;
}

describe('Background image tab', () => {
  it('renders the 图片 tab', () => {
    setup();
    expect(screen.getByText('图片')).toBeInTheDocument();
  });

  it('switching to 图片 tab emits an image background', async () => {
    const props = setup();
    await userEvent.click(screen.getByText('图片'));
    expect(props.onChange).toHaveBeenCalledWith({ type: 'image', fit: 'cover' });
  });

  it('shows upload prompt when no image', async () => {
    setup();
    await userEvent.click(screen.getByText('图片'));
    expect(screen.getByText('点击上传底图')).toBeInTheDocument();
  });

  it('shows preview, fit buttons and remove when image present', async () => {
    const props = setup({
      value: { type: 'image', fit: 'cover' },
      imageUrl: 'blob:mock',
    });
    await userEvent.click(screen.getByText('图片'));
    expect(screen.getByAltText('底图预览')).toBeInTheDocument();
    expect(screen.getByText('覆盖')).toBeInTheDocument();
    expect(screen.getByText('包含')).toBeInTheDocument();
    expect(screen.getByText('拉伸')).toBeInTheDocument();

    await userEvent.click(screen.getByText('包含'));
    expect(props.onFitChange).toHaveBeenCalledWith('contain');

    await userEvent.click(screen.getByText('移除'));
    expect(props.onClear).toHaveBeenCalled();
  });
});
