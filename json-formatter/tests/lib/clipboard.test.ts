import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyText } from '../../src/lib/clipboard';

describe('clipboard.copyText', () => {
  beforeEach(() => {
    // jsdom doesn't implement Clipboard API by default
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) }
    });
    // jsdom doesn't implement execCommand by default
    document.execCommand = vi.fn().mockImplementation(() => true) as any;
  });

  afterEach(() => {
    delete (document as any).execCommand;
  });

  it('uses navigator.clipboard.writeText when available', async () => {
    const ok = await copyText('hello');
    expect(ok).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
  });

  it('falls back to execCommand when clipboard API rejects', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));
    const execSpy = vi.spyOn(document, 'execCommand').mockImplementation(() => true);
    // fallback needs a selection area; jsdom stubs it minimally
    document.body.innerHTML = '<textarea></textarea>';
    const ok = await copyText('hello');
    expect(ok).toBe(true);
    expect(execSpy).toHaveBeenCalledWith('copy');
  });

  it('returns false when both clipboard and execCommand fail', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValueOnce(new Error('denied'));
    vi.spyOn(document, 'execCommand').mockImplementation(() => false);
    document.body.innerHTML = '<textarea></textarea>';
    const ok = await copyText('hello');
    expect(ok).toBe(false);
  });
});
