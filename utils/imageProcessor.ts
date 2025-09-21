import type { RGBAColor, ProcessingParams } from '../types';
import { rgbToHsl, hslToRgb, colorDistance } from './color';

export const processImage = (originalImageData: ImageData, processingParams: ProcessingParams): ImageData => {
  const newImageData = new ImageData(
    new Uint8ClampedArray(originalImageData.data),
    originalImageData.width,
    originalImageData.height
  );
  const data = newImageData.data;
  
  const { transparency, colorChange, unaffectedColor } = processingParams;

  const allTransparencyOps = [...transparency.history, transparency.staging];
  const allColorChangeOps = [...colorChange.history, colorChange.staging];
  
  const isUnaffectedEnabled = unaffectedColor.enabled && unaffectedColor.color;
  const unaffectedThreshold = isUnaffectedEnabled ? (unaffectedColor.tolerance / 1000) * 441.6 : 0;

  for (let i = 0; i < data.length; i += 4) {
    const originalR = originalImageData.data[i];
    const originalG = originalImageData.data[i + 1];
    const originalB = originalImageData.data[i + 2];
    const originalA = originalImageData.data[i + 3];
    const originalColor: RGBAColor = { r: originalR, g: originalG, b: originalB, a: originalA };
    
    // --- Unaffected Color Check ---
    if (isUnaffectedEnabled && colorDistance(originalColor, unaffectedColor.color!) <= unaffectedThreshold) {
        continue; // Skip all processing for this pixel
    }

    // --- Transparency ---
    let isTransparent = false;
    for (const op of allTransparencyOps) {
      if (!op.color) continue;
      const transparencyThreshold = (op.tolerance / 1000) * 441.6;
      if (colorDistance(originalColor, op.color) <= transparencyThreshold) {
        data[i + 3] = 0;
        isTransparent = true;
        break;
      }
    }
    if (isTransparent) continue;

    // --- Color Change ---
    let finalR = originalR, finalG = originalG, finalB = originalB;

    for (const op of allColorChangeOps) {
      if (!op.target) continue;
      const changeThreshold = (op.tolerance / 1000) * 441.6;

      if (colorDistance(originalColor, op.target) <= changeThreshold) {
          let [h, s, l] = rgbToHsl(finalR, finalG, finalB);
          h = (h * 360 + op.hue + 360) % 360 / 360;
          s = Math.max(0, Math.min(1, s + op.saturation / 100));
          l = Math.max(0, Math.min(1, l + op.brightness / 100));
          let [newR, newG, newB] = hslToRgb(h, s, l);

          const factor = (259 * (op.contrast + 255)) / (255 * (259 - op.contrast));
          newR = Math.max(0, Math.min(255, factor * (newR - 128) + 128));
          newG = Math.max(0, Math.min(255, factor * (newG - 128) + 128));
          newB = Math.max(0, Math.min(255, factor * (newB - 128) + 128));

          finalR = newR;
          finalG = newG;
          finalB = newB;
      }
    }
    data[i] = finalR;
    data[i + 1] = finalG;
    data[i + 2] = finalB;
  }
  
  return newImageData;
};