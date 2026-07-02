import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBar } from '../../src/components/StatusBar';
import type { Stats, CompressInfo, JsonStatus, ParseError } from '../../src/types';

const baseProps = {
  stats: { chars: 0, lines: 0, sizeBytes: 0 } as Stats,
  compressInfo: null as CompressInfo | null,
  status: 'idle' as JsonStatus,
  error: null as ParseError | null
};

describe('StatusBar', () => {
  it('shows 等待输入 when idle', () => {
    render(<StatusBar {...baseProps} status="idle" />);
    expect(screen.getByText('等待输入…')).toBeInTheDocument();
  });

  it('shows ✓ JSON有效 when valid', () => {
    render(<StatusBar {...baseProps} status="valid" />);
    expect(screen.getByText(/JSON有效/)).toBeInTheDocument();
  });

  it('shows error message when invalid', () => {
    render(<StatusBar {...baseProps} status="invalid" error={{ line: 2, col: 3, message: '多余逗号' }} />);
    expect(screen.getByText(/第2行/)).toBeInTheDocument();
  });

  it('shows char/line/size stats', () => {
    render(<StatusBar {...baseProps} status="valid" stats={{ chars: 45, lines: 5, sizeBytes: 98 }} />);
    expect(screen.getByText((_c, el) => el?.textContent === '字符: 45')).toBeInTheDocument();
    expect(screen.getByText((_c, el) => el?.textContent === '行: 5')).toBeInTheDocument();
    expect(screen.getByText(/大小: 98 B/)).toBeInTheDocument();
  });

  it('shows compression ratio when compressInfo present', () => {
    render(<StatusBar {...baseProps} status="valid" compressInfo={{ ratio: 0.32, savedBytes: 68 }} />);
    expect(screen.getByText(/68%/)).toBeInTheDocument();
  });
});
