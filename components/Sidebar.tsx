import React from 'react';
import type { RGBAColor, EyedropperTarget, UnaffectedColorState } from '../types';
import { EyedropperTargetEnum } from '../constants';
import Slider from './Slider';
import { EyeDropperIcon } from './icons';

interface ActionButtonsProps {
    onApply: () => void;
    onUndo: () => void;
    onRedo: () => void;
    onReset: () => void;
    canUndo: boolean;
    canRedo: boolean;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onApply, onUndo, onRedo, onReset, canUndo, canRedo }) => (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-600">
        <div className="flex items-center space-x-2">
            <button onClick={onUndo} disabled={!canUndo} className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">Undo</button>
            <button onClick={onRedo} disabled={!canRedo} className="px-3 py-1 text-sm bg-gray-600 rounded hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed">Redo</button>
        </div>
        <div className="flex items-center space-x-2">
            <button onClick={onReset} className="px-3 py-1 text-sm bg-yellow-600 rounded hover:bg-yellow-500">Reset</button>
            <button onClick={onApply} className="px-3 py-1 text-sm bg-cyan-600 rounded hover:bg-cyan-500">Apply</button>
        </div>
    </div>
);

interface SidebarProps {
  activeDropper: EyedropperTarget;
  onDropperActivate: (target: EyedropperTarget) => void;
  
  transparencyColor: RGBAColor | null;
  transparencyTolerance: number;
  onTransparencyToleranceChange: (value: number) => void;
  onTransparencyApply: () => void;
  onTransparencyUndo: () => void;
  onTransparencyRedo: () => void;
  onTransparencyReset: () => void;
  canUndoTransparency: boolean;
  canRedoTransparency: boolean;

  changeTargetColor: RGBAColor | null;
  changeTolerance: number;
  onChangeToleranceChange: (value: number) => void;
  hue: number;
  onHueChange: (value: number) => void;
  saturation: number;
  onSaturationChange: (value: number) => void;
  brightness: number;
  onBrightnessChange: (value: number) => void;
  contrast: number;
  onContrastChange: (value: number) => void;
  sharpness: number;
  onSharpnessChange: (value: number) => void;
  onChangeApply: () => void;
  onChangeUndo: () => void;
  onChangeRedo: () => void;
  onChangeReset: () => void;
  canUndoChange: boolean;
  canRedoChange: boolean;

  unaffectedColorState: UnaffectedColorState;
  onUnaffectedColorStateChange: (state: UnaffectedColorState) => void;

  onSaveActions: () => void;
  onLoadActionsClick: () => void;
  onRunAction: () => void;
  onRefreshSession: () => void;
  onApplyToAll: () => void;
  isActionScriptLoaded: boolean;
  isMultiFrame: boolean;
}

const ColorPickerButton: React.FC<{
    onClick: () => void;
    color: RGBAColor | null;
    isActive: boolean;
}> = ({ onClick, color, isActive }) => (
    <div className="flex items-center space-x-3">
        <button
            onClick={onClick}
            className={`p-2 rounded-md transition-colors duration-200 ${isActive ? 'bg-cyan-500 ring-2 ring-cyan-300' : 'bg-gray-600 hover:bg-gray-500'}`}
        >
            <EyeDropperIcon className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded border-2 border-gray-500" style={{ backgroundColor: color ? `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})` : 'transparent' }}></div>
        <span className="text-sm text-gray-400">{color ? `R:${color.r} G:${color.g} B:${color.b}` : 'No color selected'}</span>
    </div>
);

const Sidebar: React.FC<SidebarProps> = (props) => {
  return (
    <aside className="w-80 bg-gray-800 p-4 space-y-6 overflow-y-auto border-r border-gray-700 shadow-lg">
      <div className="p-4 bg-gray-700/50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3 text-cyan-300 border-b border-gray-600 pb-2">Pick Transparency</h2>
        <div className="space-y-4">
            <ColorPickerButton 
                onClick={() => props.onDropperActivate(EyedropperTargetEnum.Transparency)}
                color={props.transparencyColor}
                isActive={props.activeDropper === EyedropperTargetEnum.Transparency}
            />
            <Slider
                label="Tolerance"
                min={0}
                max={1000}
                value={props.transparencyTolerance}
                onChange={(e) => props.onTransparencyToleranceChange(Number(e.target.value))}
            />
        </div>
        <ActionButtons
            onApply={props.onTransparencyApply}
            onUndo={props.onTransparencyUndo}
            onRedo={props.onTransparencyRedo}
            onReset={props.onTransparencyReset}
            canUndo={props.canUndoTransparency}
            canRedo={props.canRedoTransparency}
        />
      </div>

      <div className="p-4 bg-gray-700/50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3 text-cyan-300 border-b border-gray-600 pb-2">Change Color</h2>
        <div className="space-y-4">
             <ColorPickerButton 
                onClick={() => props.onDropperActivate(EyedropperTargetEnum.ColorChange)}
                color={props.changeTargetColor}
                isActive={props.activeDropper === EyedropperTargetEnum.ColorChange}
            />
            <Slider label="Input Tolerance" min={0} max={1000} value={props.changeTolerance} onChange={(e) => props.onChangeToleranceChange(Number(e.target.value))}/>
            <Slider label="Hue" min={-180} max={180} value={props.hue} onChange={(e) => props.onHueChange(Number(e.target.value))}/>
            <Slider label="Saturation" min={-100} max={100} value={props.saturation} onChange={(e) => props.onSaturationChange(Number(e.target.value))}/>
            <Slider label="Brightness" min={-100} max={100} value={props.brightness} onChange={(e) => props.onBrightnessChange(Number(e.target.value))}/>
            <Slider label="Contrast" min={-100} max={100} value={props.contrast} onChange={(e) => props.onContrastChange(Number(e.target.value))}/>
            <Slider label="Sharpness" min={0} max={100} value={props.sharpness} onChange={(e) => props.onSharpnessChange(Number(e.target.value))}/>
        </div>
         <ActionButtons
            onApply={props.onChangeApply} onUndo={props.onChangeUndo} onRedo={props.onChangeRedo} onReset={props.onChangeReset}
            canUndo={props.canUndoChange} canRedo={props.canRedoChange}
        />
      </div>

      <div className="p-4 bg-gray-700/50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3 text-cyan-300 border-b border-gray-600 pb-2">Unaffected Color</h2>
        <div className="space-y-4">
            <div className="flex items-center space-x-2">
                <input type="checkbox" id="enableUnaffected" className="h-4 w-4 rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={props.unaffectedColorState.enabled} onChange={(e) => props.onUnaffectedColorStateChange({...props.unaffectedColorState, enabled: e.target.checked})} />
                <label htmlFor="enableUnaffected" className="text-sm font-medium">Enable unaffected color</label>
            </div>
            <ColorPickerButton onClick={() => props.onDropperActivate(EyedropperTargetEnum.UnaffectedColor)} color={props.unaffectedColorState.color} isActive={props.activeDropper === EyedropperTargetEnum.UnaffectedColor} />
            <Slider label="Tolerance" min={0} max={1000} value={props.unaffectedColorState.tolerance} onChange={(e) => props.onUnaffectedColorStateChange({...props.unaffectedColorState, tolerance: Number(e.target.value)})} />
        </div>
      </div>

      <div className="p-4 bg-gray-700/50 rounded-lg">
        <h2 className="text-lg font-semibold mb-3 text-cyan-300 border-b border-gray-600 pb-2">Action Scripting</h2>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button onClick={props.onSaveActions} className="w-full py-2 px-3 text-sm bg-gray-600 rounded hover:bg-gray-500">Save Actions</button>
            <button onClick={props.onLoadActionsClick} className="w-full py-2 px-3 text-sm bg-gray-600 rounded hover:bg-gray-500">Load Actions</button>
          </div>
          <button onClick={props.onRunAction} disabled={!props.isActionScriptLoaded} className="w-full py-2 px-3 text-sm bg-cyan-600 rounded hover:bg-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed">Run Action Script</button>
          <button onClick={props.onApplyToAll} disabled={!props.isMultiFrame} className="w-full py-2 px-3 text-sm bg-purple-600 rounded hover:bg-purple-500 disabled:bg-gray-500 disabled:cursor-not-allowed">Apply to All Frames</button>
        </div>
        <div className="pt-4 mt-4 border-t border-gray-600">
          <button onClick={props.onRefreshSession} className="w-full py-2 px-3 text-sm bg-red-700 rounded hover:bg-red-600">Refresh Session</button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
