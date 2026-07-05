import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModeSwitch } from '../../src/components/ModeSwitch';

describe('ModeSwitch', () => {
  it('renders two buttons GIF and PNG', () => {
    render(<ModeSwitch value="gif" onChange={() => {}} />);
    expect(screen.getByText('GIF')).toBeInTheDocument();
    expect(screen.getByText('PNG')).toBeInTheDocument();
  });

  it('highlights active mode', () => {
    render(<ModeSwitch value="png" onChange={() => {}} />);
    expect(screen.getByText('PNG').className).toContain('bg-blue-500');
  });

  it('calls onChange on click', async () => {
    const onChange = vi.fn();
    render(<ModeSwitch value="gif" onChange={onChange} />);
    await userEvent.click(screen.getByText('PNG'));
    expect(onChange).toHaveBeenCalledWith('png');
  });
});
