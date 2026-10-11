import { hueName } from './color';
import { templates } from './harmony';
import type { Sample } from './photo';
import { analyzeSample, type SampleAnalysisOptions } from './sampleAnalysis';

export interface ReferenceOptions extends SampleAnalysisOptions {
  intention: string;
  photoName: string;
}

export function buildReference(samples: Sample[], options: ReferenceOptions) {
  return {
    version: 1,
    photo: options.photoName,
    intention: options.intention,
    colorSpace: 'sRGB / HSL',
    harmony: options.custom ? 'Custom' : options.fit ? templates[options.fit.kind].name : 'Undetermined',
    meanRequiredHueMovement: options.custom ? null : (options.fit?.meanMovement ?? null),
    settings: { strength: options.strength, maxShift: options.maxShift, tolerance: options.tolerance },
    note: 'Reference only. HSL lightness is not perceptual luminance. Hue degrees are not Lightroom slider values. Near-neutral colors are protected. The image is not embedded.',
    samples: samples.map((sample, index) => {
      const { targetHue, nudge, original, suggested, locked } = analyzeSample(sample, index, options);
      return {
        number: index + 1,
        name: sample.name || `Sample ${index + 1}`,
        position: { x: sample.x, y: sample.y },
        original,
        suggested,
        originalHsl: sample.color,
        suggestedHsl: nudge.color,
        targetHue,
        hueShift: nudge.delta,
        direction: nudge.delta ? `Toward ${hueName(targetHue)}` : 'Keep',
        locked,
      };
    }),
  };
}
export type Reference = ReturnType<typeof buildReference>;
