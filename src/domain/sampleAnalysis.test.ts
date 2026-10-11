import { describe, expect, it } from 'vitest';
import { analyzeSample } from './sampleAnalysis';

const sample = { id: 1, name: '', x: 0.5, y: 0.5, color: { h: 30, s: 0.5, l: 0.5 }, customHue: 120 };
const options = { custom: true, strength: 0.5, maxShift: 30, tolerance: 5 };

describe('sample analysis', () => {
  it('reports a capped custom nudge with original and suggested colors', () => {
    const analysis = analyzeSample(sample, 0, options);
    expect(analysis.targetHue).toBe(120);
    expect(analysis.nudge.delta).toBe(15);
    expect(analysis.nudge.isLimited).toBe(true);
    expect(analysis.original).toBe('#BF8040');
    expect(analysis.suggested).toBe('#BF9F40');
  });

  it('keeps anchors and near-neutral colors unchanged', () => {
    const anchor = analyzeSample(sample, 0, { ...options, anchorId: 1 });
    expect(anchor.locked).toBe(true);
    expect(anchor.suggested).toBe(anchor.original);
    const neutral = analyzeSample({ ...sample, color: { h: 30, s: 0, l: 0.5 } }, 0, options);
    expect(neutral.protectedNeutral).toBe(true);
    expect(neutral.suggested).toBe(neutral.original);
  });

  it('uses the matching fitted target and falls back to the original hue', () => {
    const fit = { kind: 'triadic' as const, rotation: 0, targets: [0, 240], meanMovement: 0, rankCost: 0 };
    expect(analyzeSample(sample, 1, { ...options, custom: false, fit }).targetHue).toBe(240);
    expect(analyzeSample(sample, 2, { ...options, custom: false, fit }).targetHue).toBe(30);
  });
});
