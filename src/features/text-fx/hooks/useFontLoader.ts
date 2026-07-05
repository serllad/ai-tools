import { useState, useEffect } from 'react';
import type { FontFamily } from '../types';

const FONT_GOOGLE_MAP: Record<string, string> = {
  'noto-sans-sc': 'Noto Sans SC',
  'noto-serif-sc': 'Noto Serif SC',
  'zcool-kuaiLe': 'ZCOOL KuaiLe',
  'zcool-kuaiLe-title': 'ZCOOL QingKe HuangYou',
  'lxgw-wenkai': 'LXGW WenKai',
  'ma-shan-zheng': 'Ma Shan Zheng',
  'liu-jian-mao-cao': 'Liu Jian Mao Cao',
  'long-cang': 'Long Cang',
  'zhi-mang-xing': 'Zhi Mang Xing',
  'zcool-xiaowei': 'ZCOOL XiaoWei',
};

export type FontStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useFontLoader(fontFamily: FontFamily): FontStatus {
  const [status, setStatus] = useState<FontStatus>('idle');

  useEffect(() => {
    if (fontFamily === 'system') {
      setStatus('ready');
      return;
    }
    const googleName = FONT_GOOGLE_MAP[fontFamily];
    if (!googleName) {
      setStatus('ready');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    import('webfontloader').then((mod) => {
      const WebFont = mod.default || mod;
      WebFont.load({
        google: { families: [googleName] },
        active: () => { if (!cancelled) setStatus('ready'); },
        inactive: () => { if (!cancelled) setStatus('error'); },
      });
    }).catch(() => { if (!cancelled) setStatus('error'); });
    return () => { cancelled = true; };
  }, [fontFamily]);

  return status;
}
