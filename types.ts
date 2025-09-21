import { ViewModeEnum, EyedropperTargetEnum } from './constants';

export type ViewMode = ViewModeEnum.FitToWindow | ViewModeEnum.FitToImage | ViewModeEnum.CustomZoom;
export type EyedropperTarget = EyedropperTargetEnum.None | EyedropperTargetEnum.Transparency | EyedropperTargetEnum.ColorChange | EyedropperTargetEnum.UnaffectedColor;

export type RGBAColor = {
  r: number;
  g: number;
  b: number;
  a: number;
};

export type TransparencyState = {
  color: RGBAColor | null;
  tolerance: number;
};

export type ColorChangeState = {
  target: RGBAColor | null;
  tolerance: number;
  hue: number;
  saturation: number;
  brightness: number;
  contrast: number;
  sharpness: number;
};

export type UnaffectedColorState = {
  enabled: boolean;
  color: RGBAColor | null;
  tolerance: number;
};

export interface ProcessingParams {
  transparency: {
    history: TransparencyState[];
    staging: TransparencyState;
  };
  colorChange: {
    history: ColorChangeState[];
    staging: ColorChangeState;
  };
  unaffectedColor: UnaffectedColorState;
}

export type Action = 
  | { type: 'transparency'; params: TransparencyState }
  | { type: 'colorChange'; params: ColorChangeState };
