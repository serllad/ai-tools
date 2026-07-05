export type OutputMode = 'gif' | 'png';

export type AnimationType =
  | 'typewriter'
  | 'fade'
  | 'blink'
  | 'bounce'
  | 'heartbeat'
  | 'rainbow'
  | 'wave'
  | 'slide'
  | 'rotate'
  | 'flip'
  | 'shake'
  | 'pulse'
  | 'neon'
  | 'drop';

export type FontFamily =
  | 'system'
  | 'noto-sans-sc'
  | 'noto-serif-sc'
  | 'zcool-kuaiLe'
  | 'zcool-kuaiLe-title'
  | 'lxgw-wenkai'
  | 'ma-shan-zheng'
  | 'liu-jian-mao-cao'
  | 'long-cang'
  | 'zhi-mang-xing'
  | 'zcool-xiaowei';

export type Speed = 0.5 | 0.75 | 1 | 1.5 | 2;

export type LoopCount = 0 | 1 | 3 | 5;

export type ImageFit = 'cover' | 'contain' | 'stretch';

export type BackgroundConfig =
  | { type: 'solid'; color: string }
  | {
      type: 'gradient';
      color1: string;
      color2: string;
      direction: 'horizontal' | 'vertical' | 'diagonal';
    }
  | { type: 'transparent' }
  | { type: 'image'; fit: ImageFit };

export interface StrokeConfig {
  enabled: boolean;
  width: number;
  color: string;
}

export interface ShadowConfig {
  enabled: boolean;
  blur: number;
  offsetX: number;
  offsetY: number;
  color: string;
}

export interface TextStyleConfig {
  fontFamily: FontFamily;
  fontSize: number;
  color: string;
  bold: boolean;
  stroke: StrokeConfig;
  shadow: ShadowConfig;
}

export interface ConfigState {
  text: string;
  mode: OutputMode;
  animation: AnimationType;
  speed: Speed;
  loopCount: LoopCount;
  fontFamily: FontFamily;
  fontSize: number;
  color: string;
  bold: boolean;
  stroke: StrokeConfig;
  shadow: ShadowConfig;
  background: BackgroundConfig;
  canvasSize: { width: number; height: number } | 'custom';
  customSize: { width: number; height: number };
}

export interface AnimationState {
  opacity: number;
  scale: number;
  offsetY: number;
  perCharOffsetY: number[];
  visibleCharCount: number;
  colorOverride?: string;
  translateX: number;
  rotate?: number;
  perCharRotate?: number[];
  shadowGlow?: string;
}

export interface RenderInput {
  canvas: HTMLCanvasElement;
  text: string;
  style: TextStyleConfig;
  background: BackgroundConfig;
  backgroundImage?: { el: HTMLImageElement; fit: ImageFit };
  size: { width: number; height: number };
  animationState: AnimationState;
}

export interface Preset {
  name: string;
  config: Partial<ConfigState>;
}

export interface HistoryItem {
  id: string;
  thumbnail: string;
  textPreview: string;
  config: ConfigState;
  createdAt: number;
}
