import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorBanner } from '../../src/components/ErrorBanner';

describe('ErrorBanner', () => {
  it('renders nothing when message is null', () => {
    const { container } = render(<ErrorBanner message={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders the message when provided', () => {
    render(<ErrorBanner message="文件过大（6.0 MB），可能影响性能" />);
    expect(screen.getByText(/文件过大/)).toBeInTheDocument();
  });

  it('has role="alert" for accessibility', () => {
    render(<ErrorBanner message="复制失败" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
