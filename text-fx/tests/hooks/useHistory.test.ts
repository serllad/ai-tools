import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory, HISTORY_KEY, MAX_HISTORY } from '../../src/hooks/useHistory';
import type { ConfigState } from '../../src/types';

const mockConfig: ConfigState = {
  text: 'test',
  mode: 'gif',
  animation: 'typewriter',
  speed: 1,
  loopCount: 0,
  fontFamily: 'system',
  fontSize: 48,
  color: '#fff',
  bold: false,
  stroke: { enabled: false, width: 0, color: '#000' },
  shadow: { enabled: false, blur: 0, offsetX: 0, offsetY: 0, color: '#000' },
  background: { type: 'solid', color: '#000' },
  canvasSize: { width: 500, height: 200 },
  customSize: { width: 500, height: 200 },
};

beforeEach(() => {
  localStorage.clear();
});

describe('useHistory', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useHistory());
    expect(result.current.items).toEqual([]);
  });

  it('adds an item', () => {
    const { result } = renderHook(() => useHistory());
    act(() => {
      result.current.addItem({ thumbnail: 'data:', textPreview: 'test', config: mockConfig });
    });
    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].textPreview).toBe('test');
  });

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useHistory());
    act(() => {
      result.current.addItem({ thumbnail: 'data:', textPreview: 'test', config: mockConfig });
    });
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    expect(stored).toHaveLength(1);
  });

  it('caps at MAX_HISTORY (10)', () => {
    const { result } = renderHook(() => useHistory());
    act(() => {
      for (let i = 0; i < 12; i++) {
        result.current.addItem({
          thumbnail: 'data:',
          textPreview: `t${i}`,
          config: mockConfig,
        });
      }
    });
    expect(result.current.items).toHaveLength(MAX_HISTORY);
    expect(result.current.items[0].textPreview).toBe('t11');
  });

  it('removes an item by id', () => {
    const { result } = renderHook(() => useHistory());
    act(() => {
      result.current.addItem({ thumbnail: 'data:', textPreview: 'a', config: mockConfig });
      result.current.addItem({ thumbnail: 'data:', textPreview: 'b', config: mockConfig });
    });
    const id = result.current.items[0].id;
    act(() => {
      result.current.removeItem(id);
    });
    expect(result.current.items).toHaveLength(1);
  });
});
