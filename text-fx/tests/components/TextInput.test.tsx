import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TextInput } from '../../src/components/TextInput';

describe('TextInput', () => {
  it('renders textarea', () => {
    render(<TextInput value="" onChange={() => {}} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('shows char and line count', () => {
    render(<TextInput value={"hello\nworld"} onChange={() => {}} />);
    expect(screen.getByText(/2 行/)).toBeInTheDocument();
    expect(screen.getByText(/10 字/)).toBeInTheDocument();
  });

  it('calls onChange on input', async () => {
    const onChange = vi.fn();
    render(<TextInput value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole('textbox'), 'a');
    expect(onChange).toHaveBeenCalledWith('a');
  });

  it('warns when exceeding 5 lines', () => {
    const text = 'a\nb\nc\nd\ne\nf';
    render(<TextInput value={text} onChange={() => {}} />);
    expect(screen.getByText(/最多 5 行/)).toBeInTheDocument();
  });

  it('warns when exceeding 50 chars', () => {
    const text = 'a'.repeat(51);
    render(<TextInput value={text} onChange={() => {}} />);
    expect(screen.getByText(/最多 50 字/)).toBeInTheDocument();
  });
});
