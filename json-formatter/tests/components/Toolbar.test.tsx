import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from '../../src/components/Toolbar';

const baseProps = {
  onFormat: vi.fn(),
  onCompress: vi.fn(),
  onUnwrap: vi.fn(),
  onDecodeUnicode: vi.fn(),
  onDecodeUrls: vi.fn(),
  onCopy: vi.fn(),
  onClear: vi.fn(),
  onToggleHistory: vi.fn(),
  onUploadClick: vi.fn(),
  onToggleSettings: vi.fn(),
  onToggleTheme: vi.fn(),
  canFormat: false,
  canCopy: false,
  copied: false,
  historyCount: 0
};

describe('Toolbar', () => {
  it('disables 格式化 button when canFormat is false', () => {
    render(<Toolbar {...baseProps} />);
    expect(screen.getByRole('button', { name: /格式化/ })).toBeDisabled();
  });

  it('enables 格式化 button when canFormat is true', () => {
    render(<Toolbar {...baseProps} canFormat={true} />);
    expect(screen.getByRole('button', { name: /格式化/ })).not.toBeDisabled();
  });

  it('calls onFormat when 格式化 clicked', () => {
    const onFormat = vi.fn();
    render(<Toolbar {...baseProps} canFormat={true} onFormat={onFormat} />);
    fireEvent.click(screen.getByRole('button', { name: /格式化/ }));
    expect(onFormat).toHaveBeenCalled();
  });

  it('shows 已复制 ✓ when copied is true', () => {
    render(<Toolbar {...baseProps} canCopy={true} copied={true} />);
    expect(screen.getByRole('button', { name: /已复制/ })).toBeInTheDocument();
  });

  it('disables 复制 button when canCopy is false', () => {
    render(<Toolbar {...baseProps} canCopy={false} />);
    expect(screen.getByRole('button', { name: /复制/ })).toBeDisabled();
  });

  it('calls onClear when 清除 clicked', () => {
    const onClear = vi.fn();
    render(<Toolbar {...baseProps} onClear={onClear} />);
    fireEvent.click(screen.getByRole('button', { name: /清除/ }));
    expect(onClear).toHaveBeenCalled();
  });

  it('shows history count badge', () => {
    render(<Toolbar {...baseProps} historyCount={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('calls onUnwrap when 去转义 clicked', () => {
    const onUnwrap = vi.fn();
    render(<Toolbar {...baseProps} canFormat={true} onUnwrap={onUnwrap} />);
    fireEvent.click(screen.getByRole('button', { name: /去转义/ }));
    expect(onUnwrap).toHaveBeenCalled();
  });

  it('calls onDecodeUnicode when Unicode 解码 clicked', () => {
    const onDecodeUnicode = vi.fn();
    render(<Toolbar {...baseProps} canFormat={true} onDecodeUnicode={onDecodeUnicode} />);
    fireEvent.click(screen.getByRole('button', { name: /Unicode 解码/ }));
    expect(onDecodeUnicode).toHaveBeenCalled();
  });

  it('calls onDecodeUrls when URL 解码 clicked', () => {
    const onDecodeUrls = vi.fn();
    render(<Toolbar {...baseProps} canFormat={true} onDecodeUrls={onDecodeUrls} />);
    fireEvent.click(screen.getByRole('button', { name: /URL 解码/ }));
    expect(onDecodeUrls).toHaveBeenCalled();
  });
});
