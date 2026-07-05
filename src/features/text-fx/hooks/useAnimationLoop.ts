import { useEffect, useRef } from 'react';
import { AnimationLoop } from '../engine/animationLoop';
import { getAnimationState } from '../engine/animations';
import { render } from '../engine/canvasRenderer';
import type { ConfigState, ImageFit } from '../types';

type LoopConfig = ConfigState & {
  backgroundImage?: { el: HTMLImageElement; fit: ImageFit };
};

export function useAnimationLoop(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  config: LoopConfig,
): void {
  const configRef = useRef(config);
  configRef.current = config;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (configRef.current.mode === 'png') {
      const animState = getAnimationState(configRef.current.animation, 0, {
        speed: configRef.current.speed,
        charCount: configRef.current.text.length,
        totalChars: configRef.current.text.length,
      });
      render({
        canvas,
        text: configRef.current.text,
        style: {
          fontFamily: configRef.current.fontFamily,
          fontSize: configRef.current.fontSize,
          color: configRef.current.color,
          bold: configRef.current.bold,
          stroke: configRef.current.stroke,
          shadow: configRef.current.shadow,
        },
        background: configRef.current.background,
        backgroundImage: configRef.current.backgroundImage,
        size: configRef.current.canvasSize === 'custom' ? configRef.current.customSize : configRef.current.canvasSize,
        animationState: animState,
      });
      return;
    }

    const startTime = performance.now();
    const getT = () => (performance.now() - startTime) / 1000;

    const doRender = () => {
      const cfg = configRef.current;
      const t = getT();
      const animState = getAnimationState(cfg.animation, t, {
        speed: cfg.speed,
        charCount: cfg.text.length,
        totalChars: cfg.text.length,
      });
      render({
        canvas,
        text: cfg.text,
        style: {
          fontFamily: cfg.fontFamily,
          fontSize: cfg.fontSize,
          color: cfg.color,
          bold: cfg.bold,
          stroke: cfg.stroke,
          shadow: cfg.shadow,
        },
        background: cfg.background,
        backgroundImage: cfg.backgroundImage,
        size: cfg.canvasSize === 'custom' ? cfg.customSize : cfg.canvasSize,
        animationState: animState,
      });
    };

    const loop = new AnimationLoop(doRender, getT, {
      loopCount: configRef.current.loopCount,
      cycleDuration: 2,
    });
    loop.start();
    return () => loop.stop();
  }, [
    canvasRef,
    config.mode, config.animation, config.speed, config.loopCount,
    config.text, config.fontFamily, config.fontSize, config.color,
    config.bold, config.stroke, config.shadow, config.background,
    config.backgroundImage, config.canvasSize, config.customSize,
  ]);
}
