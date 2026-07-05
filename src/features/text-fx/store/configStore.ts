import { create } from 'zustand';
import type {
  ConfigState,
  OutputMode,
  AnimationType,
  BackgroundConfig,
  Preset,
  FontFamily,
  Speed,
  LoopCount,
  StrokeConfig,
  ShadowConfig,
  ImageFit,
} from '../types';

const defaultState: ConfigState = {
  text: '',
  mode: 'gif',
  animation: 'typewriter',
  speed: 1,
  loopCount: 0,
  fontFamily: 'system',
  fontSize: 48,
  color: '#ffffff',
  bold: false,
  stroke: { enabled: false, width: 2, color: '#000000' },
  shadow: { enabled: false, blur: 4, offsetX: 2, offsetY: 2, color: '#000000' },
  background: { type: 'solid', color: '#1a1a2e' },
  canvasSize: { width: 500, height: 200 },
  customSize: { width: 500, height: 200 },
};

export const PRESETS: Preset[] = [
  {
    name: '限时抢购',
    config: { text: '限时抢购', mode: 'gif', animation: 'blink', speed: 1, loopCount: 0, color: '#ffffff', bold: true, background: { type: 'solid', color: '#e63946' } },
  },
  {
    name: '新品上市',
    config: { text: '新品上市', mode: 'gif', animation: 'slide', speed: 1, color: '#ffffff', background: { type: 'gradient', color1: '#667eea', color2: '#764ba2', direction: 'horizontal' } },
  },
  {
    name: '早安晚安',
    config: { text: '早安', mode: 'gif', animation: 'typewriter', speed: 1, color: '#3d2c2c', background: { type: 'solid', color: '#ffd6a5' } },
  },
  {
    name: '关注我',
    config: { text: '关注我', mode: 'gif', animation: 'heartbeat', speed: 1, color: '#ff6b9d', background: { type: 'transparent' } },
  },
  {
    name: '节日快乐',
    config: { text: '节日快乐', mode: 'gif', animation: 'rainbow', speed: 1, color: '#ffd700', background: { type: 'solid', color: '#2d1b3d' } },
  },
  {
    name: '纯文字封面',
    config: { text: '文字', mode: 'png', fontSize: 96, color: '#1a1a1a', background: { type: 'solid', color: '#ffffff' } },
  },
];

interface ConfigStore extends ConfigState {
  bgImage: HTMLImageElement | null;
  bgImageUrl: string | null;
  setText: (t: string) => void;
  setMode: (m: OutputMode) => void;
  setAnimation: (a: AnimationType) => void;
  setSpeed: (s: Speed) => void;
  setLoopCount: (l: LoopCount) => void;
  setFontFamily: (f: FontFamily) => void;
  setFontSize: (n: number) => void;
  setColor: (c: string) => void;
  setBold: (b: boolean) => void;
  setStroke: (s: StrokeConfig) => void;
  setShadow: (s: ShadowConfig) => void;
  setBackground: (b: BackgroundConfig) => void;
  setBgImage: (file: File) => void;
  setBgImageFit: (fit: ImageFit) => void;
  clearBgImage: () => void;
  setCanvasSize: (s: { width: number; height: number } | 'custom') => void;
  setCustomSize: (s: { width: number; height: number }) => void;
  applyPreset: (p: Preset) => void;
  reset: () => void;
}

export const useConfigStore = create<ConfigStore>((set, get) => ({
  ...defaultState,
  bgImage: null,
  bgImageUrl: null,
  setText: (t) => set({ text: t }),
  setMode: (m) => set({ mode: m }),
  setAnimation: (a) => set({ animation: a }),
  setSpeed: (s) => set({ speed: s }),
  setLoopCount: (l) => set({ loopCount: l }),
  setFontFamily: (f) => set({ fontFamily: f }),
  setFontSize: (n) => set({ fontSize: n }),
  setColor: (c) => set({ color: c }),
  setBold: (b) => set({ bold: b }),
  setStroke: (s) => set({ stroke: s }),
  setShadow: (s) => set({ shadow: s }),
  setBackground: (b) => set({ background: b }),
  setBgImage: (file) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const prevUrl = get().bgImageUrl;
      if (prevUrl && prevUrl !== url) URL.revokeObjectURL(prevUrl);
      const bg = get().background;
      const fit: ImageFit = bg.type === 'image' ? bg.fit : 'cover';
      set({ bgImage: img, bgImageUrl: url, background: { type: 'image', fit } });
    };
    img.src = url;
  },
  setBgImageFit: (fit) => {
    if (get().background.type === 'image') {
      set({ background: { type: 'image', fit } });
    }
  },
  clearBgImage: () => {
    const url = get().bgImageUrl;
    if (url) URL.revokeObjectURL(url);
    set({ bgImage: null, bgImageUrl: null, background: defaultState.background });
  },
  setCanvasSize: (s) => set({ canvasSize: s }),
  setCustomSize: (s) => set({ customSize: s }),
  applyPreset: (p) => set({ ...p.config } as Partial<ConfigStore>),
  reset: () => {
    const url = get().bgImageUrl;
    if (url) URL.revokeObjectURL(url);
    set({ ...defaultState, bgImage: null, bgImageUrl: null });
  },
}));
