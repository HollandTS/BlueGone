import React, { useRef, useEffect, useState, useLayoutEffect, forwardRef, useImperativeHandle } from 'react';
import type { ViewMode, RGBAColor, ProcessingParams } from '../types';
import { ViewModeEnum } from '../constants';
import { processImage } from '../utils/imageProcessor';

interface ImageCanvasProps {
  image: HTMLImageElement | null;
  viewMode: ViewMode;
  zoom: number;
  isEyedropperActive: boolean;
  onColorPick: (color: RGBAColor) => void;
  processingParams: ProcessingParams;
}

export interface ImageCanvasHandle {
  getCanvasDataURL: () => string;
}

const ImageCanvas = forwardRef<ImageCanvasHandle, ImageCanvasProps>(({
  image,
  viewMode,
  zoom,
  isEyedropperActive,
  onColorPick,
  processingParams,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useImperativeHandle(ref, () => ({
    getCanvasDataURL: () => {
      const canvas = canvasRef.current;
      if (!canvas || !image) return '';
      // Ensure we draw the final processed image at full resolution before getting data URL
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = image.naturalWidth;
      offscreenCanvas.height = image.naturalHeight;
      const ctx = offscreenCanvas.getContext('2d');
      if (ctx && originalImageData) {
        const processed = processImage(originalImageData, processingParams);
        ctx.putImageData(processed, 0, 0);
        return offscreenCanvas.toDataURL('image/png');
      }
      return canvas.toDataURL('image/png');
    },
  }));

  useLayoutEffect(() => {
    if (!image) return;

    const calculateSize = () => {
      const container = containerRef.current;
      if (!container) return;
      
      let newWidth = image.naturalWidth;
      let newHeight = image.naturalHeight;
      
      if (viewMode === ViewModeEnum.FitToWindow) {
        const { clientWidth: containerWidth, clientHeight: containerHeight } = container;
        const imgAspectRatio = image.naturalWidth / image.naturalHeight;
        const containerAspectRatio = containerWidth / containerHeight;

        if (imgAspectRatio > containerAspectRatio) {
          newWidth = containerWidth;
          newHeight = containerWidth / imgAspectRatio;
        } else {
          newHeight = containerHeight;
          newWidth = containerHeight * imgAspectRatio;
        }
      } else if (viewMode === ViewModeEnum.FitToImage) {
        newWidth = image.naturalWidth;
        newHeight = image.naturalHeight;
      } else { // Custom Zoom
        newWidth = image.naturalWidth * zoom;
        newHeight = image.naturalHeight * zoom;
      }
      setCanvasSize({ width: newWidth, height: newHeight });
    };

    calculateSize();

    if (viewMode === ViewModeEnum.FitToWindow) {
        const resizeObserver = new ResizeObserver(calculateSize);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }
        return () => resizeObserver.disconnect();
    }
  }, [image, viewMode, zoom, containerRef]);

  useEffect(() => {
    if (!image) {
      setOriginalImageData(null);
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }

    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = image.naturalWidth;
    offscreenCanvas.height = image.naturalHeight;
    const offscreenCtx = offscreenCanvas.getContext('2d');
    if (offscreenCtx) {
      offscreenCtx.drawImage(image, 0, 0);
      setOriginalImageData(offscreenCtx.getImageData(0, 0, image.naturalWidth, image.naturalHeight));
    }
  }, [image]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageData || !image) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const processedImageData = processImage(originalImageData, processingParams);
    
    ctx.putImageData(processedImageData, 0, 0);

  }, [originalImageData, processingParams, image]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isEyedropperActive) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const pixel = ctx.getImageData(x, y, 1, 1).data;
    onColorPick({ r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] / 255 });
  };
  
  if (!image) {
      return <div className="text-gray-500 text-center">
        <p className="text-xl">Load an image or multiple images to get started.</p>
        <p className="text-sm mt-2">You can also drag and drop files onto this area.</p>
      </div>
  }

  return (
    <div ref={containerRef} className="w-full h-full flex items-center justify-center">
        <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className={`shadow-lg bg-white ${isEyedropperActive ? 'cursor-crosshair' : 'cursor-grab'}`}
            style={{ width: `${canvasSize.width}px`, height: `${canvasSize.height}px`, imageRendering: 'pixelated' }}
        />
    </div>
  );
});

export default ImageCanvas;