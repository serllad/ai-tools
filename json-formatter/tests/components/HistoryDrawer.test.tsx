import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { HistoryDrawer } from '../../src/components/HistoryDrawer';
import type { HistoryItem } from '../../src/types';

const items: HistoryItem[] = [
  { id: '1', summary: '{"a":1}', content: '{"a":1}', sizeBytes: 7, createdAt: 1700000000000 },
  { id: '2', summary: '{"b":2}', content: '{"b":2}', sizeBytes: 7, createdAt: 1700000001000 }
];

describe('HistoryDrawer', () => {
  it('renders each item summary', () => {
    render(<HistoryDrawer open={true} items={items} onLoad={() => {}} onRemove={() => {}} onClearAll={() => {}} onClose={() => {}} />);
    expect(screen.getByText('{"a":1}')).toBeInTheDocument();
    expect(screen.getByText('{"b":2}')).toBeInTheDocument();
  });

  it('calls onLoad with item when 恢复 clicked', () => {
    const onLoad = vi.fn();
    render(<HistoryDrawer open={true} items={items} onLoad={onLoad} onRemove={() => {}} onClearAll={() => {}} onClose={() => {}} />);
    const restoreButtons = screen.getAllByRole('button', { name: /恢复/ });
    fireEvent.click(restoreButtons[0]);
    expect(onLoad).toHaveBeenCalledWith(items[0]);
  });

  it('calls onRemove with id when 删除 clicked', () => {
    const onRemove = vi.fn();
    render(<HistoryDrawer open={true} items={items} onLoad={() => {}} onRemove={onRemove} onClearAll={() => {}} onClose={() => {}} />);
    const removeButtons = screen.getAllByRole('button', { name: /删除/ });
    fireEvent.click(removeButtons[0]);
    expect(onRemove).toHaveBeenCalledWith('1');
  });

  it('calls onClearAll when 全部清除 clicked', () => {
    const onClearAll = vi.fn();
    render(<HistoryDrawer open={true} items={items} onLoad={() => {}} onRemove={() => {}} onClearAll={onClearAll} onClose={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /全部清除/ }));
    expect(onClearAll).toHaveBeenCalled();
  });

  it('renders empty hint when no items', () => {
    render(<HistoryDrawer open={true} items={[]} onLoad={() => {}} onRemove={() => {}} onClearAll={() => {}} onClose={() => {}} />);
    expect(screen.getByText(/暂无历史/)).toBeInTheDocument();
  });

  it('renders nothing when open=false', () => {
    const { container } = render(<HistoryDrawer open={false} items={items} onLoad={() => {}} onRemove={() => {}} onClearAll={() => {}} onClose={() => {}} />);
    expect(container.querySelector('[data-testid="history-drawer"]')).toBeNull();
  });
});
