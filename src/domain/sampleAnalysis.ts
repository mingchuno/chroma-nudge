import { hasMeaningfulHue, hslToHex } from './color';
import { type HarmonyFit, suggestNudge } from './harmony';
import type { Sample } from './photo';

export interface SampleAnalysisOptions {
  fit?: HarmonyFit;
  custom: boolean;
  anchorId?: number;
  strength: number;
  maxShift: number;
  tolerance: number;
}

export function analyzeSample(sample: Sample, index: number, options: SampleAnalysisOptions) {
  const targetHue = options.custom
    ? (sample.customHue ?? sample.color.h)
    : (options.fit?.targets[index] ?? sample.color.h);
  const locked = sample.id === options.anchorId;
  const nudge = suggestNudge(sample.color, { ...options, targetHue, isLocked: locked });
  return {
    targetHue,
    locked,
    nudge,
    original: hslToHex(sample.color),
    suggested: hslToHex(nudge.color),
    protectedNeutral: !hasMeaningfulHue(sample.color),
  };
}
