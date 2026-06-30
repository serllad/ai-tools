import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useJsonStore } from '../../src/store/useJsonStore';

beforeEach(() => {
  localStorage.clear();
  useJsonStore.setState({
    input: '', output: '', status: 'idle', error: null, lastError: null,
    stats: { chars: 0, lines: 0, sizeBytes: 0 },
    compressInfo: null, history: [],
    autoFormat: false, confirmClear: true, theme: 'system'
  });
});

describe('useJsonStore.setInput', () => {
  it('updates input and stats', () => {
    useJsonStore.getState().setInput('{"a":1}');
    const s = useJsonStore.getState();
    expect(s.input).toBe('{"a":1}');
    expect(s.stats.chars).toBe(7);
    expect(s.stats.sizeBytes).toBe(7);
  });

  it('sets status=valid for valid JSON', () => {
    useJsonStore.getState().setInput('{"a":1}');
    expect(useJsonStore.getState().status).toBe('valid');
  });

  it('sets status=invalid with error for bad JSON', () => {
    useJsonStore.getState().setInput('{name:1}');
    const s = useJsonStore.getState();
    expect(s.status).toBe('invalid');
    expect(s.error).not.toBeNull();
    expect(s.error?.line).toBe(1);
  });

  it('sets status=idle for empty input', () => {
    useJsonStore.getState().setInput('');
    expect(useJsonStore.getState().status).toBe('idle');
  });
});

describe('useJsonStore.format', () => {
  it('formats valid input into output', () => {
    useJsonStore.getState().setInput('{"a":1}');
    useJsonStore.getState().format();
    expect(useJsonStore.getState().output).toBe('{\n  "a": 1\n}');
  });

  it('sets compressInfo on success', () => {
    useJsonStore.getState().setInput('{"a":1}');
    useJsonStore.getState().format();
    expect(useJsonStore.getState().compressInfo).not.toBeNull();
  });

  it('adds to history on success', () => {
    useJsonStore.getState().setInput('{"a":1}');
    useJsonStore.getState().format();
    expect(useJsonStore.getState().history.length).toBe(1);
  });

  it('sets lastError when input invalid', () => {
    useJsonStore.getState().setInput('{name:1}');
    useJsonStore.getState().format();
    expect(useJsonStore.getState().lastError).not.toBeNull();
    expect(useJsonStore.getState().output).toBe('');
  });
});

describe('useJsonStore.compress', () => {
  it('compresses valid input', () => {
    useJsonStore.getState().setInput('{\n  "a": 1\n}');
    useJsonStore.getState().compress();
    expect(useJsonStore.getState().output).toBe('{"a":1}');
  });
});

describe('useJsonStore.clear', () => {
  it('resets input/output but keeps settings', () => {
    useJsonStore.getState().setInput('{"a":1}');
    useJsonStore.getState().format();
    useJsonStore.getState().setAutoFormat(true);
    useJsonStore.getState().clear();
    const s = useJsonStore.getState();
    expect(s.input).toBe('');
    expect(s.output).toBe('');
    expect(s.status).toBe('idle');
    expect(s.autoFormat).toBe(true);
  });
});

describe('useJsonStore.copy', () => {
  it('returns true and does not set lastError on success', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    useJsonStore.getState().setInput('{"a":1}');
    useJsonStore.getState().format();
    await useJsonStore.getState().copy();
    expect(useJsonStore.getState().lastError).toBeNull();
  });

  it('sets lastError when copy fails', async () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    document.execCommand = vi.fn(() => false) as any;
    document.body.innerHTML = '<textarea></textarea>';
    useJsonStore.getState().setInput('{"a":1}');
    useJsonStore.getState().format();
    await useJsonStore.getState().copy();
    expect(useJsonStore.getState().lastError).toContain('复制失败');
  });
});

describe('useJsonStore history', () => {
  it('loadHistory sets input and output', () => {
    const item = { id: '1', summary: '{"a":1}', content: '{"a":1}', sizeBytes: 7, createdAt: 0 };
    useJsonStore.getState().loadHistory(item);
    expect(useJsonStore.getState().input).toBe('{"a":1}');
    expect(useJsonStore.getState().output).toBe('{\n  "a": 1\n}');
  });

  it('removeHistory removes by id', () => {
    useJsonStore.setState({ history: [
      { id: '1', summary: '', content: '{"a":1}', sizeBytes: 7, createdAt: 0 },
      { id: '2', summary: '', content: '{"b":2}', sizeBytes: 7, createdAt: 0 }
    ]});
    useJsonStore.getState().removeHistory('1');
    expect(useJsonStore.getState().history.length).toBe(1);
    expect(useJsonStore.getState().history[0].id).toBe('2');
  });

  it('clearHistory empties history', () => {
    useJsonStore.setState({ history: [
      { id: '1', summary: '', content: '{"a":1}', sizeBytes: 7, createdAt: 0 }
    ]});
    useJsonStore.getState().clearHistory();
    expect(useJsonStore.getState().history).toEqual([]);
  });
});

describe('useJsonStore settings', () => {
  it('setAutoFormat toggles and persists', () => {
    useJsonStore.getState().setAutoFormat(true);
    expect(useJsonStore.getState().autoFormat).toBe(true);
    expect(localStorage.getItem('json-formatter:autoFormat')).toBe('true');
  });

  it('setTheme persists', () => {
    useJsonStore.getState().setTheme('dark');
    expect(useJsonStore.getState().theme).toBe('dark');
    expect(localStorage.getItem('json-formatter:theme')).toBe('dark');
  });
});
