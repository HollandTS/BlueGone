
import React, { useState, useRef } from 'react';
import JSZip from 'jszip';
import type { ViewMode, RGBAColor, EyedropperTarget, TransparencyState, ColorChangeState, ProcessingParams, UnaffectedColorState, Action } from './types';
import { ViewModeEnum, EyedropperTargetEnum, ZOOM_LEVELS } from './constants';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import ImageCanvas, { type ImageCanvasHandle } from './components/ImageCanvas';
import { processImage } from './utils/imageProcessor';


const App: React.FC = () => {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [imageNames, setImageNames] = useState<string[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewModeEnum.FitToWindow);
  const [zoom, setZoom] = useState<number>(1);
  const [activeDropper, setActiveDropper] = useState<EyedropperTarget>(EyedropperTargetEnum.None);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const canvasRef = useRef<ImageCanvasHandle>(null);
  const actionScriptInputRef = useRef<HTMLInputElement>(null);

  // --- State Definitions ---
  const initialTransparencyState: TransparencyState = { color: null, tolerance: 50 };
  const initialColorChangeState: ColorChangeState = {
    target: null,
    tolerance: 50,
    hue: 0,
    saturation: 0,
    brightness: 0,
    contrast: 0,
    sharpness: 0,
  };
  const initialUnaffectedColorState: UnaffectedColorState = { enabled: false, color: null, tolerance: 50 };

  // Staging state (controlled by sliders)
  const [transparencyColor, setTransparencyColor] = useState<RGBAColor | null>(initialTransparencyState.color);
  const [transparencyTolerance, setTransparencyTolerance] = useState<number>(initialTransparencyState.tolerance);

  const [changeTargetColor, setChangeTargetColor] = useState<RGBAColor | null>(initialColorChangeState.target);
  const [changeTolerance, setChangeTolerance] = useState<number>(initialColorChangeState.tolerance);
  const [hue, setHue] = useState<number>(initialColorChangeState.hue);
  const [saturation, setSaturation] = useState<number>(initialColorChangeState.saturation);
  const [brightness, setBrightness] = useState<number>(initialColorChangeState.brightness);
  const [contrast, setContrast] = useState<number>(initialColorChangeState.contrast);
  const [sharpness, setSharpness] = useState<number>(initialColorChangeState.sharpness);

  const [unaffectedColorState, setUnaffectedColorState] = useState<UnaffectedColorState>(initialUnaffectedColorState);
  
  // History state (holds "applied" states for current frame)
  const [transparencyHistory, setTransparencyHistory] = useState<TransparencyState[]>([initialTransparencyState]);
  const [transparencyHistoryIndex, setTransparencyHistoryIndex] = useState(0);

  const [colorChangeHistory, setColorChangeHistory] = useState<ColorChangeState[]>([initialColorChangeState]);
  const [colorChangeHistoryIndex, setColorChangeHistoryIndex] = useState(0);

  // Action Scripting State
  const [recordedSession, setRecordedSession] = useState<Action[]>([]);
  const [loadedActionScript, setLoadedActionScript] = useState<Action[] | null>(null);

  const resetAllHistories = () => {
      handleTransparencyReset(true);
      handleColorChangeReset(true);
      setUnaffectedColorState(initialUnaffectedColorState);
  };

  const handleImageUpload = (files: FileList) => {
    if (files.length === 0) return;
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if(imageFiles.length === 0) return;
    
    const imagePromises = imageFiles.map(file => {
        return new Promise<{img: HTMLImageElement, name: string}>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve({img, name: file.name.replace(/\.[^/.]+$/, "")});
                img.onerror = reject;
                img.src = e.target?.result as string;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    });

    Promise.all(imagePromises).then(loadedImages => {
        setImages(loadedImages.map(i => i.img));
        setImageNames(loadedImages.map(i => i.name));
        setCurrentFrameIndex(0);
        setViewMode(ViewModeEnum.FitToWindow);
        setZoom(1);
        resetAllHistories();
        setRecordedSession([]);
        setLoadedActionScript(null);
    });
  };
  
  const handleFrameChange = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < images.length) {
      setCurrentFrameIndex(newIndex);
      resetAllHistories(); // Reset edits when changing frame
    }
  };

  const handleSaveImages = async () => {
    if (!canvasRef.current || images.length === 0) return;
    
    setIsLoading(true);
    const currentImage = images[currentFrameIndex];

    if (images.length === 1) {
        // Single image save
        const dataUrl = canvasRef.current.getCanvasDataURL();
        const link = document.createElement('a');
        const date = new Date().toISOString().split('T')[0];
        link.download = `${imageNames[currentFrameIndex]}_${date}.png`;
        link.href = dataUrl;
        link.click();
    } else {
        // Multiple image save (zip)
        const zip = new JSZip();
        
        for(let i=0; i < images.length; i++) {
            const image = images[i];
            const offscreenCanvas = document.createElement('canvas');
            offscreenCanvas.width = image.naturalWidth;
            offscreenCanvas.height = image.naturalHeight;
            const ctx = offscreenCanvas.getContext('2d');
            if(!ctx) continue;
            
            ctx.drawImage(image, 0, 0);
            const originalImageData = ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
            const processedImageData = processImage(originalImageData, processingParams);
            ctx.putImageData(processedImageData, 0, 0);
            
            const blob = await new Promise<Blob | null>(resolve => offscreenCanvas.toBlob(resolve, 'image/png'));
            if(blob) {
                zip.file(`${imageNames[i]}_processed.png`, blob);
            }
        }
        
        const zipBlob = await zip.generateAsync({type:"blob"});
        const link = document.createElement('a');
        link.download = `processed_images_${new Date().toISOString().split('T')[0]}.zip`;
        link.href = URL.createObjectURL(zipBlob);
        link.click();
        URL.revokeObjectURL(link.href);
    }
    setIsLoading(false);
  };

  const handleColorPicked = (color: RGBAColor) => {
    if (activeDropper === EyedropperTargetEnum.Transparency) {
      setTransparencyColor(color);
    } else if (activeDropper === EyedropperTargetEnum.ColorChange) {
      setChangeTargetColor(color);
    } else if (activeDropper === EyedropperTargetEnum.UnaffectedColor) {
      setUnaffectedColorState(prev => ({...prev, color}));
    }
    setActiveDropper(EyedropperTargetEnum.None);
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    setViewMode(ViewModeEnum.CustomZoom);
  };

  const handleDragOver = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleImageUpload(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };

  // --- Action Handlers ---
  const handleTransparencyApply = () => {
    const newState: TransparencyState = { color: transparencyColor, tolerance: transparencyTolerance };
    setRecordedSession([...recordedSession, { type: 'transparency', params: newState }]);
    const newHistory = transparencyHistory.slice(0, transparencyHistoryIndex + 1);
    newHistory.push(newState);
    setTransparencyHistory(newHistory);
    setTransparencyHistoryIndex(newHistory.length - 1);
    handleTransparencyReset();
  };
  const handleTransparencyUndo = () => { if (transparencyHistoryIndex > 0) { setTransparencyHistoryIndex(transparencyHistoryIndex - 1); handleTransparencyReset(); } };
  const handleTransparencyRedo = () => { if (transparencyHistoryIndex < transparencyHistory.length - 1) { setTransparencyHistoryIndex(transparencyHistoryIndex + 1); handleTransparencyReset(); } };
  const handleTransparencyReset = (resetHistory = false) => {
    setTransparencyColor(initialTransparencyState.color);
    setTransparencyTolerance(initialTransparencyState.tolerance);
    if(resetHistory) { setTransparencyHistory([initialTransparencyState]); setTransparencyHistoryIndex(0); }
  };

  const handleColorChangeApply = () => {
    const newState: ColorChangeState = { target: changeTargetColor, tolerance: changeTolerance, hue, saturation, brightness, contrast, sharpness };
    setRecordedSession([...recordedSession, { type: 'colorChange', params: newState }]);
    const newHistory = colorChangeHistory.slice(0, colorChangeHistoryIndex + 1);
    newHistory.push(newState);
    setColorChangeHistory(newHistory);
    setColorChangeHistoryIndex(newHistory.length - 1);
    handleColorChangeReset();
  };
  const handleColorChangeUndo = () => { if (colorChangeHistoryIndex > 0) { setColorChangeHistoryIndex(colorChangeHistoryIndex - 1); handleColorChangeReset(); } };
  const handleColorChangeRedo = () => { if (colorChangeHistoryIndex < colorChangeHistory.length - 1) { setColorChangeHistoryIndex(colorChangeHistoryIndex + 1); handleColorChangeReset(); } };
  const handleColorChangeReset = (resetHistory = false) => {
    setChangeTargetColor(initialColorChangeState.target);
    setChangeTolerance(initialColorChangeState.tolerance);
    setHue(initialColorChangeState.hue);
    setSaturation(initialColorChangeState.saturation);
    setBrightness(initialColorChangeState.brightness);
    setContrast(initialColorChangeState.contrast);
    setSharpness(initialColorChangeState.sharpness);
    if(resetHistory) { setColorChangeHistory([initialColorChangeState]); setColorChangeHistoryIndex(0); }
  };
  
  // --- Action Scripting Handlers ---
  const handleSaveActions = () => {
    const dataStr = JSON.stringify(recordedSession, null, 2);
    const dataBlob = new Blob([dataStr], {type: "application/json"});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.download = `actions_${new Date().toISOString().split('T')[0]}.json`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  };
  const handleLoadActions = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const script = JSON.parse(event.target?.result as string);
            // TODO: Add validation for the script format
            setLoadedActionScript(script);
        } catch (error) {
            console.error("Failed to parse action script:", error);
            alert("Invalid action script file.");
        }
    };
    reader.readAsText(file);
  };
  const handleRunAction = () => {
      if(!loadedActionScript) return;
      resetAllHistories();
      let currentTransHistory = [initialTransparencyState];
      let currentColHistory = [initialColorChangeState];

      loadedActionScript.forEach(action => {
          if(action.type === 'transparency') {
              currentTransHistory.push(action.params as TransparencyState);
          } else if (action.type === 'colorChange') {
              currentColHistory.push(action.params as ColorChangeState);
          }
      });
      setTransparencyHistory(currentTransHistory);
      setTransparencyHistoryIndex(currentTransHistory.length-1);
      setColorChangeHistory(currentColHistory);
      setColorChangeHistoryIndex(currentColHistory.length-1);
  };
  const handleRefreshSession = () => {
      setRecordedSession([]);
      setLoadedActionScript(null);
      resetAllHistories();
  };

  const handleApplyToAll = async () => {
      if(images.length <= 1) return;
      setIsLoading(true);

      const newImagesPromises = images.map((image) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
              const offscreenCanvas = document.createElement('canvas');
              offscreenCanvas.width = image.naturalWidth;
              offscreenCanvas.height = image.naturalHeight;
              const ctx = offscreenCanvas.getContext('2d');
              if(!ctx) return reject('Could not get context');

              ctx.drawImage(image, 0, 0);
              const originalImageData = ctx.getImageData(0, 0, image.naturalWidth, image.naturalHeight);
              const processedImageData = processImage(originalImageData, processingParams);
              ctx.putImageData(processedImageData, 0, 0);
              
              const newImg = new Image();
              newImg.onload = () => resolve(newImg);
              newImg.onerror = reject;
              newImg.src = offscreenCanvas.toDataURL('image/png');
          });
      });

      try {
          const processedImages = await Promise.all(newImagesPromises);
          setImages(processedImages);
          resetAllHistories();
      } catch (error) {
          console.error("Failed to apply session to all frames:", error);
      } finally {
          setIsLoading(false);
      }
  };

  const processingParams: ProcessingParams = {
    transparency: {
      history: transparencyHistory.slice(0, transparencyHistoryIndex + 1),
      staging: { color: transparencyColor, tolerance: transparencyTolerance }
    },
    colorChange: {
      history: colorChangeHistory.slice(0, colorChangeHistoryIndex + 1),
      staging: { target: changeTargetColor, tolerance: changeTolerance, hue, saturation, brightness, contrast, sharpness }
    },
    unaffectedColor: unaffectedColorState,
  };

  const currentImage = images.length > 0 ? images[currentFrameIndex] : null;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-200 font-sans">
      <Header
        // FIX: The `handleImageUpload` function expects a `FileList` object.
        // The previous code was constructing an invalid, non-iterable object that
        // did not match the `FileList` type, causing a compile error.
        // Passing the `handleImageUpload` function directly ensures the correct
        // `FileList` object from the file input is processed.
        onImageUpload={handleImageUpload}
        onSaveImages={handleSaveImages}
        isImageLoaded={currentImage !== null}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        zoom={zoom}
        onZoomChange={handleZoomChange}
        zoomLevels={ZOOM_LEVELS}
        frameCount={images.length}
        currentFrame={currentFrameIndex}
        onFrameChange={handleFrameChange}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeDropper={activeDropper} onDropperActivate={setActiveDropper}
          transparencyColor={transparencyColor} transparencyTolerance={transparencyTolerance} onTransparencyToleranceChange={setTransparencyTolerance}
          onTransparencyApply={handleTransparencyApply} onTransparencyUndo={handleTransparencyUndo} onTransparencyRedo={handleTransparencyRedo} onTransparencyReset={() => handleTransparencyReset()}
          canUndoTransparency={transparencyHistoryIndex > 0} canRedoTransparency={transparencyHistoryIndex < transparencyHistory.length - 1}

          changeTargetColor={changeTargetColor} changeTolerance={changeTolerance} onChangeToleranceChange={setChangeTolerance}
          hue={hue} onHueChange={setHue} saturation={saturation} onSaturationChange={setSaturation}
          brightness={brightness} onBrightnessChange={setBrightness} contrast={contrast} onContrastChange={setContrast} sharpness={sharpness} onSharpnessChange={setSharpness}
          onChangeApply={handleColorChangeApply} onChangeUndo={handleColorChangeUndo} onChangeRedo={handleColorChangeRedo} onChangeReset={() => handleColorChangeReset()}
          canUndoChange={colorChangeHistoryIndex > 0} canRedoChange={colorChangeHistoryIndex < colorChangeHistory.length - 1}

          unaffectedColorState={unaffectedColorState} onUnaffectedColorStateChange={setUnaffectedColorState}

          onSaveActions={handleSaveActions}
          onLoadActionsClick={() => actionScriptInputRef.current?.click()}
          onRunAction={handleRunAction}
          onRefreshSession={handleRefreshSession}
          onApplyToAll={handleApplyToAll}
          isActionScriptLoaded={loadedActionScript !== null}
          isMultiFrame={images.length > 1}
        />
        <input type="file" ref={actionScriptInputRef} onChange={handleLoadActions} accept=".json" className="hidden" />
        <main 
          className="flex-1 bg-gray-800 flex items-center justify-center p-4 overflow-auto relative"
          onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-cyan-900 bg-opacity-70 flex items-center justify-center z-20 border-4 border-dashed border-cyan-400 pointer-events-none">
                <div className="text-center"><h2 className="text-3xl font-bold text-white">Drop to Upload</h2><p className="text-cyan-200 mt-2">Release your image file(s) to load them into the editor</p></div>
            </div>
          )}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-900 bg-opacity-80 flex items-center justify-center z-30 pointer-events-none">
                <div className="text-center"><div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-cyan-400 mx-auto"></div><p className="text-cyan-200 mt-4 text-xl">Processing...</p></div>
            </div>
          )}
          <ImageCanvas
            ref={canvasRef}
            image={currentImage}
            viewMode={viewMode} zoom={zoom} isEyedropperActive={activeDropper !== EyedropperTargetEnum.None}
            onColorPick={handleColorPicked} processingParams={processingParams}
          />
        </main>
      </div>
    </div>
  );
};

export default App;
