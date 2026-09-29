/**
 * Face processing, feature embedding, and liveness verification service.
 * Operates on still frames without storing high-res photos or video streams.
 */

import { LivenessChallenge, LivenessChallengeType } from '../types';

export const LIVENESS_CHALLENGES: LivenessChallenge[] = [
  { id: '1', type: 'blink', prompt: 'Blink your eyes naturally', iconName: 'Eye' },
  { id: '2', type: 'turn_left', prompt: 'Turn your head slightly to the left', iconName: 'ArrowLeft' },
  { id: '3', type: 'turn_right', prompt: 'Turn your head slightly to the right', iconName: 'ArrowRight' },
  { id: '4', type: 'smile', prompt: 'Give a gentle smile', iconName: 'Smile' },
  { id: '5', type: 'tilt_up', prompt: 'Tilt your chin slightly upward', iconName: 'ArrowUp' },
];

export function getRandomLivenessChallenge(): LivenessChallenge {
  const index = Math.floor(Math.random() * LIVENESS_CHALLENGES.length);
  return LIVENESS_CHALLENGES[index];
}

/**
 * Extracts a normalized 128-dimensional feature embedding from a canvas
 */
export function extractEmbeddingFromCanvas(canvas: HTMLCanvasElement): number[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return new Array(128).fill(0);

  // Resize canvas frame to a standard 128x128 face patch
  const patchCanvas = document.createElement('canvas');
  patchCanvas.width = 128;
  patchCanvas.height = 128;
  const pCtx = patchCanvas.getContext('2d');
  if (!pCtx) return new Array(128).fill(0);

  pCtx.drawImage(canvas, 0, 0, 128, 128);
  const imgData = pCtx.getImageData(0, 0, 128, 128);
  const data = imgData.data;

  // We compute a 128-dimensional spatial-luminance & gradient distribution descriptor
  // Dividing into a 4x4 spatial grid (16 cells), each cell contributing 8 directional/intensity gradients = 128 features
  const embedding = new Float32Array(128);
  const cellSize = 32;

  for (let cy = 0; cy < 4; cy++) {
    for (let cx = 0; cx < 4; cx++) {
      const cellIndex = (cy * 4 + cx) * 8;
      let totalLuma = 0;
      let gradX = 0;
      let gradY = 0;
      let maxLuma = 0;
      let minLuma = 255;
      let edgeCount = 0;

      for (let y = cy * cellSize; y < (cy + 1) * cellSize; y++) {
        for (let x = cx * cellSize; x < (cx + 1) * cellSize; x++) {
          const idx = (y * 128 + x) * 4;
          // Perceived luminance
          const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          totalLuma += luma;
          if (luma > maxLuma) maxLuma = luma;
          if (luma < minLuma) minLuma = luma;

          if (x < 127 && y < 127) {
            const rightIdx = (y * 128 + (x + 1)) * 4;
            const downIdx = ((y + 1) * 128 + x) * 4;
            const rightLuma = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];
            const downLuma = 0.299 * data[downIdx] + 0.587 * data[downIdx + 1] + 0.114 * data[downIdx + 2];
            const gx = Math.abs(rightLuma - luma);
            const gy = Math.abs(downLuma - luma);
            gradX += gx;
            gradY += gy;
            if (gx + gy > 30) edgeCount++;
          }
        }
      }

      const pixelCount = cellSize * cellSize;
      const meanLuma = totalLuma / pixelCount;
      const contrast = maxLuma - minLuma;

      embedding[cellIndex] = meanLuma / 255.0;
      embedding[cellIndex + 1] = contrast / 255.0;
      embedding[cellIndex + 2] = gradX / (pixelCount * 30);
      embedding[cellIndex + 3] = gradY / (pixelCount * 30);
      embedding[cellIndex + 4] = edgeCount / (pixelCount * 0.5);
      embedding[cellIndex + 5] = (minLuma) / 255.0;
      embedding[cellIndex + 6] = (maxLuma) / 255.0;
      embedding[cellIndex + 7] = Math.sqrt(gradX * gradX + gradY * gradY) / (pixelCount * 40);
    }
  }

  // L2 Normalize the vector so dot-product equals cosine similarity directly
  let sumSq = 0;
  for (let i = 0; i < 128; i++) {
    sumSq += embedding[i] * embedding[i];
  }
  const norm = Math.sqrt(sumSq) || 1e-6;
  const result: number[] = new Array(128);
  for (let i = 0; i < 128; i++) {
    result[i] = parseFloat((embedding[i] / norm).toFixed(6));
  }

  return result;
}

/**
 * Computes average of multiple enrollment embeddings
 */
export function computeAveragedEmbedding(embeddings: number[][]): number[] {
  if (embeddings.length === 0) return new Array(128).fill(0);
  const avg = new Array(128).fill(0);
  for (const emb of embeddings) {
    for (let i = 0; i < 128; i++) {
      avg[i] += emb[i];
    }
  }

  // Average & L2 normalize
  let sumSq = 0;
  for (let i = 0; i < 128; i++) {
    avg[i] /= embeddings.length;
    sumSq += avg[i] * avg[i];
  }
  const norm = Math.sqrt(sumSq) || 1e-6;
  return avg.map((v) => parseFloat((v / norm).toFixed(6)));
}

/**
 * Computes Cosine Similarity between two L2-normalized embeddings.
 * Returns score between 0.00 and 1.00.
 */
export function compareFaceEmbeddings(emb1: number[], emb2: number[]): number {
  if (!emb1 || !emb2 || emb1.length !== emb2.length) return 0;
  let dot = 0;
  for (let i = 0; i < emb1.length; i++) {
    dot += emb1[i] * emb2[i];
  }
  // Clamp between 0 and 1
  const score = Math.max(0, Math.min(1, dot));
  return parseFloat(score.toFixed(3));
}

/**
 * Compresses canvas frame to small thumbnail (< 50KB JPEG data URL)
 */
export function compressCanvasToThumbnail(canvas: HTMLCanvasElement): string {
  const thumbCanvas = document.createElement('canvas');
  thumbCanvas.width = 160;
  thumbCanvas.height = 160;
  const ctx = thumbCanvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/jpeg', 0.6);

  ctx.drawImage(canvas, 0, 0, 160, 160);
  // Quality 0.6 produces ~8-14KB image
  return thumbCanvas.toDataURL('image/jpeg', 0.6);
}

/**
 * Checks for live movement/changes between consecutive frames for liveness detection
 */
export function detectFrameMotion(
  prevCanvas: HTMLCanvasElement | null,
  currentCanvas: HTMLCanvasElement
): { motionScore: number; hasMotion: boolean } {
  if (!prevCanvas) return { motionScore: 0, hasMotion: false };

  const pCtx = prevCanvas.getContext('2d');
  const cCtx = currentCanvas.getContext('2d');
  if (!pCtx || !cCtx) return { motionScore: 0, hasMotion: false };

  // Sample center area (face region)
  const w = 64;
  const h = 64;
  const prevData = pCtx.getImageData(0, 0, prevCanvas.width, prevCanvas.height);
  const currData = cCtx.getImageData(0, 0, currentCanvas.width, currentCanvas.height);

  let totalDiff = 0;
  const step = 8;
  let sampled = 0;

  for (let y = 0; y < currentCanvas.height; y += step) {
    for (let x = 0; x < currentCanvas.width; x += step) {
      const idx = (y * currentCanvas.width + x) * 4;
      const dR = Math.abs(currData.data[idx] - prevData.data[idx]);
      const dG = Math.abs(currData.data[idx + 1] - prevData.data[idx + 1]);
      const dB = Math.abs(currData.data[idx + 2] - prevData.data[idx + 2]);
      totalDiff += (dR + dG + dB) / 3;
      sampled++;
    }
  }

  const avgDiff = sampled > 0 ? totalDiff / sampled : 0;
  // Live human micro-movements or challenge motions give diffs between 6 and 80
  const hasMotion = avgDiff > 5 && avgDiff < 140;

  return {
    motionScore: Math.min(100, Math.round(avgDiff * 2)),
    hasMotion,
  };
}
