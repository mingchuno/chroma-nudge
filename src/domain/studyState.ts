import { type Hsl, hasMeaningfulHue } from './color';
import type { Sample } from './photo';
import { MAX_SAMPLES } from './samplingPolicy';

export interface StudyState {
  samples: Sample[];
  colors: Hsl[];
  selectedId?: number;
  anchorId?: number;
  autoSampleUndo?: { ids: number[]; selectedId?: number };
}
export const emptyStudy: StudyState = { samples: [], colors: [] };
export type StudyAction =
  | { type: 'place'; sample: Sample }
  | { type: 'update'; id: number; updates: Partial<Pick<Sample, 'name' | 'customHue'>> }
  | { type: 'remove'; id: number }
  | { type: 'select'; id?: number }
  | { type: 'anchor'; id?: number }
  | { type: 'clear' }
  | { type: 'demo'; samples: Sample[] }
  | { type: 'autoSample'; samples: Sample[] }
  | { type: 'undoAutoSample' }
  | { type: 'customTargets'; targets?: number[] };

function withSamples(state: StudyState, samples: Sample[]): StudyState {
  const sameColors =
    samples.length === state.colors.length &&
    samples.every((sample, index) => sample.color === state.colors[index]);
  return {
    ...state,
    samples,
    // Names and custom targets must not invalidate expensive harmony fitting.
    colors: sameColors ? state.colors : samples.map((sample) => sample.color),
    selectedId: samples.some((sample) => sample.id === state.selectedId) ? state.selectedId : undefined,
    anchorId: samples.some((sample) => sample.id === state.anchorId && hasMeaningfulHue(sample.color))
      ? state.anchorId
      : undefined,
  };
}

export function studyReducer(state: StudyState, action: StudyAction): StudyState {
  switch (action.type) {
    case 'place': {
      const existing = state.samples.some((sample) => sample.id === action.sample.id);
      if (!existing && state.samples.length >= MAX_SAMPLES) return state;
      const samples = existing
        ? state.samples.map((sample) =>
            sample.id === action.sample.id
              ? { ...sample, x: action.sample.x, y: action.sample.y, color: action.sample.color }
              : sample,
          )
        : [...state.samples, action.sample];
      return withSamples({ ...state, selectedId: action.sample.id }, samples);
    }
    case 'update':
      return withSamples(
        state,
        state.samples.map((sample) => (sample.id === action.id ? { ...sample, ...action.updates } : sample)),
      );
    case 'remove':
      return withSamples(
        state,
        state.samples.filter((sample) => sample.id !== action.id),
      );
    case 'select':
      return withSamples({ ...state, selectedId: action.id }, state.samples);
    case 'anchor':
      return withSamples({ ...state, anchorId: action.id }, state.samples);
    case 'clear':
      return emptyStudy;
    case 'demo':
      return withSamples({ ...emptyStudy, selectedId: action.samples[0]?.id }, action.samples);
    case 'autoSample': {
      const added = action.samples.slice(0, MAX_SAMPLES - state.samples.length);
      if (!added.length) return state;
      return withSamples(
        {
          ...state,
          selectedId: added[0]?.id,
          autoSampleUndo: { ids: added.map((sample) => sample.id), selectedId: state.selectedId },
        },
        [...state.samples, ...added],
      );
    }
    case 'undoAutoSample': {
      if (!state.autoSampleUndo) return state;
      const { ids, selectedId } = state.autoSampleUndo;
      return withSamples(
        {
          ...state,
          autoSampleUndo: undefined,
          selectedId:
            state.selectedId !== undefined && ids.includes(state.selectedId) ? selectedId : state.selectedId,
        },
        state.samples.filter((sample) => !ids.includes(sample.id)),
      );
    }
    case 'customTargets':
      return withSamples(
        state,
        state.samples.map((sample, index) => ({
          ...sample,
          customHue: sample.customHue ?? action.targets?.[index] ?? sample.color.h,
        })),
      );
  }
}
