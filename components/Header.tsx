import React, { useRef } from 'react';
import type { ViewMode } from '../types';
import { ViewModeEnum } from '../constants';
import Dropdown from './Dropdown';

interface HeaderProps {
  onImageUpload: (files: FileList) => void;
  onSaveImages: () => void;
  isImageLoaded: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  zoomLevels: number[];
  frameCount: number;
  currentFrame: number;
  onFrameChange: (newIndex: number) => void;
}

const Header: React.FC<HeaderProps> = ({
  onImageUpload,
  onSaveImages,
  isImageLoaded,
  viewMode,
  onViewModeChange,
  zoom,
  onZoomChange,
  zoomLevels,
  frameCount,
  currentFrame,
  onFrameChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onImageUpload(e.target.files);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const viewOptions = [ViewModeEnum.FitToWindow, ViewModeEnum.FitToImage];

  return (
    <header className="bg-gray-900 shadow-md p-2 flex items-center justify-between z-10 border-b border-gray-700">
      <h1 className="text-xl font-bold text-cyan-400">BlueGone</h1>
      <div className="flex items-center space-x-4">
        <button
          onClick={handleUploadClick}
          className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
        >
          Load Image(s)
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          multiple
        />
        <button
          onClick={onSaveImages}
          disabled={!isImageLoaded}
          className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          Save Image(s)
        </button>

        {frameCount > 1 && (
            <div className="flex items-center space-x-2 text-white">
                <button onClick={() => onFrameChange(currentFrame - 1)} disabled={currentFrame === 0} className="px-2 py-1 bg-gray-700 rounded disabled:opacity-50">◀</button>
                <span>{currentFrame + 1} / {frameCount}</span>
                <button onClick={() => onFrameChange(currentFrame + 1)} disabled={currentFrame === frameCount - 1} className="px-2 py-1 bg-gray-700 rounded disabled:opacity-50">▶</button>
            </div>
        )}

        <Dropdown
          options={viewOptions}
          selectedValue={viewMode === ViewModeEnum.CustomZoom ? ViewModeEnum.FitToWindow : viewMode}
          onSelect={(option) => onViewModeChange(option as ViewMode)}
        />
        
        <div className="flex items-center space-x-2">
            <label htmlFor="zoom-select" className="text-sm font-medium text-gray-400">Zoom:</label>
            <select
              id="zoom-select"
              value={zoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white focus:ring-cyan-500 focus:border-cyan-500"
            >
              {zoomLevels.map((level) => (
                <option key={level} value={level}>
                  {Math.round(level * 100)}%
                </option>
              ))}
            </select>
        </div>
      </div>
    </header>
  );
};

export default Header;