import type { RenderInput, BackgroundConfig, ImageFit } from '../types';

const FONT_MAP: Record<string, string> = {
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
  system: 'sans-serif',
};

function drawImageBackground(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  fit: ImageFit,
  width: number,
  height: number,
): void {
  const iw = img.width;
  const ih = img.height;
  if (!iw || !ih) return;
  if (fit === 'stretch') { ctx.drawImage(img, 0, 0, width, height); return; }
  if (fit === 'cover') {
    const scale = Math.max(width / iw, height / ih);
    const sw = width / scale;
    const sh = height / scale;
    const sx = (iw - sw) / 2;
    const sy = (ih - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);
    return;
  }
  const scale = Math.min(width / iw, height / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(img, (width - dw) / 2, (height - dh) / 2, dw, dh);
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  bg: BackgroundConfig,
  width: number,
  height: number,
  bgImage?: { el: HTMLImageElement; fit: ImageFit },
): void {
  if (bg.type === 'transparent') return;
  if (bg.type === 'image') {
    if (bgImage) drawImageBackground(ctx, bgImage.el, bgImage.fit, width, height);
    return;
  }
  if (bg.type === 'solid') {
    ctx.fillStyle = bg.color;
    ctx.fillRect(0, 0, width, height);
    return;
  }
  let gradient: CanvasGradient;
  if (bg.direction === 'horizontal') gradient = ctx.createLinearGradient(0, 0, width, 0);
  else if (bg.direction === 'vertical') gradient = ctx.createLinearGradient(0, 0, 0, height);
  else gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, bg.color1);
  gradient.addColorStop(1, bg.color2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

export function render(input: RenderInput): void {
  const { canvas, text, style, background, backgroundImage, size, animationState } = input;
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, size.width, size.height);
  drawBackground(ctx, background, size.width, size.height, backgroundImage);
  const lines = text.split('\n');
  const lineHeight = style.fontSize * 1.3;
  const totalHeight = lines.length * lineHeight;
  const startY = (size.height - totalHeight) / 2 + style.fontSize;
  const fontWeight = style.bold ? 'bold' : 'normal';
  ctx.font = `${fontWeight} ${style.fontSize}px ${FONT_MAP[style.fontFamily] || 'sans-serif'}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  let charIndex = 0;
  let drawn = 0;
  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx];
    const lineY = startY + lineIdx * lineHeight + (animationState.offsetY || 0);
    const lineCenterX = size.width / 2 + (animationState.translateX || 0);
    for (let i = 0; i < line.length; i++) {
      if (drawn >= animationState.visibleCharCount) return;
      const ch = line[i];
      const charOffset = animationState.perCharOffsetY[charIndex] || 0;
      ctx.save();
      ctx.globalAlpha = animationState.opacity;
      if (animationState.shadowGlow) {
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowColor = animationState.colorOverride || style.color;
        const glowMatch = animationState.shadowGlow.match(/0 0 (\d+)px/);
        if (glowMatch) ctx.shadowBlur = Number(glowMatch[1]);
      } else if (style.shadow.enabled) {
        ctx.shadowBlur = style.shadow.blur;
        ctx.shadowOffsetX = style.shadow.offsetX;
        ctx.shadowOffsetY = style.shadow.offsetY;
        ctx.shadowColor = style.shadow.color;
      }
      const lineWidth = ctx.measureText(line).width;
      const prefixWidth = ctx.measureText(line.substring(0, i + 1)).width;
      const chWidth = ctx.measureText(ch).width;
      const charX = lineCenterX - lineWidth / 2 + prefixWidth - chWidth / 2;
      const charRotate = animationState.perCharRotate?.[charIndex] || animationState.rotate || 0;
      if (animationState.scale !== 1 || charRotate !== 0) {
        ctx.translate(charX, lineY + charOffset);
        if (charRotate !== 0) ctx.rotate((charRotate * Math.PI) / 180);
        ctx.scale(animationState.scale, animationState.scale);
        if (style.stroke.enabled) { ctx.lineWidth = style.stroke.width; ctx.strokeStyle = style.stroke.color; ctx.strokeText(ch, 0, 0); }
        ctx.fillStyle = animationState.colorOverride || style.color;
        ctx.fillText(ch, 0, 0);
      } else {
        if (style.stroke.enabled) { ctx.lineWidth = style.stroke.width; ctx.strokeStyle = style.stroke.color; ctx.strokeText(ch, charX, lineY + charOffset); }
        ctx.fillStyle = animationState.colorOverride || style.color;
        ctx.fillText(ch, charX, lineY + charOffset);
      }
      ctx.restore();
      charIndex++;
      drawn++;
    }
  }
}
