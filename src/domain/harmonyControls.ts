import type { HarmonyFit, HarmonyKind } from './harmony';
import type { Sample } from './photo';
export type WheelMode = 'natural' | 'pure' | 'guide';
export type Selection = 'auto' | 'custom' | HarmonyKind;
export interface HarmonyView {
  samples: Sample[];
  fit?: HarmonyFit;
  mode: WheelMode;
  isCustom: boolean;
  selectedId?: number;
  selected?: Sample;
  chromaticCount: number;
  selection: Selection;
  strength: number;
  maxShift: number;
  tolerance: number;
  rankings: HarmonyFit[];
}
export interface HarmonyActions {
  selectSample: (id: number) => void;
  updateSample: (id: number, updates: Partial<Pick<Sample, 'name' | 'customHue'>>) => void;
  changeMode: (mode: WheelMode) => void;
  chooseHarmony: (selection: Selection) => void;
  changeStrength: (strength: number) => void;
  changeMaxShift: (maxShift: number) => void;
  changeTolerance: (tolerance: number) => void;
}
