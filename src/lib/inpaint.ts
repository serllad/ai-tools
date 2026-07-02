/**
 * Image inpainting engine.
 * 
 * Primary: OpenCV.js (WASM) loaded from CDN, using cv.INPAINT_TELEA
 * Fallback: Custom FMM-based algorithm
 */

// ---- Fallback algorithm (simple FMM-based IDW) ----
const SEARCH_RADIUS = 40;
const MIN_WEIGHT = 50;

function clamp(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : v;
}

function samplePixel(
  x: number, y: number,
  result: Uint8ClampedArray, known: Uint8Array,
  width: number, height: number,
): boolean {
  const idx = (y * width + x) * 4;
  let sumR = 0, sumG = 0, sumB = 0, sumA = 0, sumW = 0;
  for (let r = 1; r <= SEARCH_RADIUS; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const ni = ny * width + nx;
        if (known[ni] < 1) continue;
        const nIdx = ni * 4;
        const dSq = dx * dx + dy * dy;
        const w = 1.0 / (dSq + 0.01);
        sumR += result[nIdx] * w;
        sumG += result[nIdx + 1] * w;
        sumB += result[nIdx + 2] * w;
        sumA += result[nIdx + 3] * w;
        sumW += w;
      }
    }
    if (sumW >= MIN_WEIGHT) break;
  }
  if (sumW > 0) {
    result[idx] = clamp(Math.round(sumR / sumW));
    result[idx + 1] = clamp(Math.round(sumG / sumW));
    result[idx + 2] = clamp(Math.round(sumB / sumW));
    result[idx + 3] = clamp(Math.round(sumA / sumW));
    return true;
  }
  return false;
}

function nearestPixel(
  x: number, y: number,
  result: Uint8ClampedArray, src: Uint8ClampedArray, known: Uint8Array,
  width: number, height: number,
): void {
  const idx = (y * width + x) * 4;
  for (let r = 1; r < 100; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const ni = ny * width + nx;
        if (known[ni] < 1) continue;
        const nIdx = ni * 4;
        result[idx] = src[nIdx];
        result[idx + 1] = src[nIdx + 1];
        result[idx + 2] = src[nIdx + 2];
        result[idx + 3] = src[nIdx + 3];
        return;
      }
    }
  }
}

function featherBoundary(
  result: Uint8ClampedArray, mask: boolean[],
  width: number, height: number,
): void {
  const blurKernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!mask[i]) continue;
      let isBoundary =
        (x > 0 && !mask[y * width + (x - 1)]) ||
        (x < width - 1 && !mask[y * width + (x + 1)]) ||
        (y > 0 && !mask[(y - 1) * width + x]) ||
        (y < height - 1 && !mask[(y + 1) * width + x]);
      if (!isBoundary) continue;
      const idx = i * 4;
      let sumR = 0, sumG = 0, sumB = 0, sumW = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const nx = x + kx, ny = y + ky;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nIdx = (ny * width + nx) * 4;
          const kw = blurKernel[(ky + 1) * 3 + (kx + 1)];
          sumR += result[nIdx] * kw;
          sumG += result[nIdx + 1] * kw;
          sumB += result[nIdx + 2] * kw;
          sumW += kw;
        }
      }
      if (sumW > 0) {
        result[idx] = clamp(Math.round(sumR / sumW));
        result[idx + 1] = clamp(Math.round(sumG / sumW));
        result[idx + 2] = clamp(Math.round(sumB / sumW));
      }
    }
  }
}

function fallbackInpaint(
  data: Uint8ClampedArray, width: number, height: number, mask: boolean[],
): Uint8ClampedArray {
  const result = new Uint8ClampedArray(data);
  const known = new Uint8Array(width * height);
  let remaining = 0;
  for (let i = 0; i < width * height; i++) {
    if (mask[i]) { known[i] = 0; remaining++; }
    else { known[i] = 1; }
  }
  if (remaining === 0) return result;

  interface Entry { x: number; y: number; dist: number; }
  const queue: Entry[] = [];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (known[i] !== 0) continue;
      if (
        (x > 0 && known[y * width + (x - 1)] >= 1) ||
        (x < width - 1 && known[y * width + (x + 1)] >= 1) ||
        (y > 0 && known[(y - 1) * width + x] >= 1) ||
        (y < height - 1 && known[(y + 1) * width + x] >= 1)
      ) {
        queue.push({ x, y, dist: 1 });
      }
    }
  }
  if (queue.length === 0) return result;

  const ndx = [0, 0, -1, 1], ndy = [-1, 1, 0, 0];

  while (queue.length > 0 && remaining > 0) {
    let bestIdx = 0;
    for (let i = 1; i < queue.length; i++)
      if (queue[i].dist < queue[bestIdx].dist) bestIdx = i;
    const { x, y } = queue[bestIdx];
    queue[bestIdx] = queue[queue.length - 1];
    queue.pop();
    const pi = y * width + x;
    if (known[pi] !== 0) continue;

    if (!samplePixel(x, y, result, known, width, height))
      nearestPixel(x, y, result, data, known, width, height);

    known[pi] = 2;
    remaining--;
    const baseDist = queue.length > 0 ? queue[0].dist : 1;
    for (let n = 0; n < 4; n++) {
      const nx = x + ndx[n], ny = y + ndy[n];
      if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
      const ni = ny * width + nx;
      if (known[ni] !== 0) continue;
      known[ni] = 3;
      queue.push({ x: nx, y: ny, dist: baseDist + 1 });
    }
  }

  featherBoundary(result, mask, width, height);
  return result;
}

// ---- OpenCV.js loader ----

let opencvLoading: Promise<any> | null = null;
let opencvAvailable = false;

const OPENCV_CDN = 'https://docs.opencv.org/4.9.0/opencv.js';

/**
 * Dynamically load OpenCV.js from CDN.
 * Returns the cv object once ready.
 */
export async function loadOpenCV(): Promise<any> {
  if (opencvAvailable && (window as any).cv) return (window as any).cv;
  if (opencvLoading) return opencvLoading;

  opencvLoading = new Promise((resolve, reject) => {
    const cv = (window as any).cv;
    if (cv && cv.Mat) {
      opencvAvailable = true;
      resolve(cv);
      return;
    }

    const script = document.createElement('script');
    script.src = OPENCV_CDN;
    script.async = true;
    script.onload = () => {
      // OpenCV.js calls a callback when WASM is ready
      const check = () => {
        if ((window as any).cv && (window as any).cv.Mat) {
          opencvAvailable = true;
          resolve((window as any).cv);
        } else {
          setTimeout(check, 100);
        }
      };
      setTimeout(check, 500); // give it a moment to initialize WASM
    };
    script.onerror = () => {
      opencvLoading = null;
      reject(new Error('Failed to load OpenCV.js'));
    };
    document.head.appendChild(script);
  });

  return opencvLoading;
}

/**
 * Check if OpenCV.js has been loaded and is ready.
 */
export function isOpenCVReady(): boolean {
  return opencvAvailable && !!(window as any).cv;
}

/**
 * Inpaint using OpenCV TELEA algorithm.
 * Falls back to custom algorithm if OpenCV is not available.
 */
export async function inpaintWithOpenCV(
  imageData: ImageData,
  maskArray: boolean[],
  onProgress?: (msg: string) => void,
): Promise<ImageData | null> {
  let cv: any;
  try {
    cv = await loadOpenCV();
  } catch {
    return null; // caller should use fallback
  }

  const w = imageData.width;
  const h = imageData.height;

  onProgress?.('OpenCV 处理中...');

  // Create RGBA Mat from image data
  const src = cv.matFromImageData(imageData);

  // Create single-channel mask Mat
  const maskMat = new cv.Mat(h, w, cv.CV_8UC1, new cv.Scalar(0));
  const maskData = maskMat.data;

  for (let i = 0; i < w * h; i++) {
    maskData[i] = maskArray[i] ? 255 : 0;
  }

  const dst = new cv.Mat();
  cv.inpaint(src, maskMat, dst, 3, cv.INPAINT_TELEA);

  // Convert dst back to ImageData
  const resultData = new ImageData(
    new Uint8ClampedArray(dst.data),
    dst.cols,
    dst.rows,
  );

  // Cleanup
  src.delete();
  maskMat.delete();
  dst.delete();

  return resultData;
}

/**
 * Main entry point. Tries OpenCV first, falls back to custom algorithm.
 */
export async function inpaintRegion(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  mask: boolean[],
  onProgress?: (msg: string) => void,
): Promise<Uint8ClampedArray> {
  // Try OpenCV
  const imageData = new ImageData(
    new Uint8ClampedArray(data),
    width,
    height,
  );

  const result = await inpaintWithOpenCV(imageData, mask, onProgress);
  if (result) {
    return new Uint8ClampedArray(result.data);
  }

  // Fallback to custom algorithm
  onProgress?.('使用本地算法处理...');
  return fallbackInpaint(data, width, height, mask);
}
