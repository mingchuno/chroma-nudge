import { describe, expect, it } from 'vitest';
import { hslToRgb, rgbToHsl, signedHueDelta } from './color';
import { fitHarmony, rankHarmonies, suggestNudge } from './harmony';

describe('color coordinates', () => {
  it('takes the shortest path across the red seam', () => {
    expect(signedHueDelta(355, 5)).toBe(10);
    expect(signedHueDelta(5, 355)).toBe(-10);
  });
  it('round trips sRGB including neutrals', () => {
    for (const rgb of [
      { r: 247, g: 212, b: 175 },
      { r: 119, g: 117, b: 120 },
      { r: 0, g: 0, b: 0 },
      { r: 255, g: 255, b: 255 },
    ]) {
      expect(hslToRgb(rgbToHsl(rgb))).toEqual(rgb);
    }
  });
});

const color = (h: number, s = 0.7, l = 0.5) => ({ h, s, l });

describe('harmony fitting', () => {
  it('fits an exact complementary pair with no movement', () => {
    expect(fitHarmony([color(20), color(200)], 'complementary').meanMovement).toBeLessThan(0.01);
  });
  it('keeps analogous colors inside a continuous arc', () => {
    expect(fitHarmony([color(350), color(10), color(30)], 'analogous').meanMovement).toBe(0);
  });
  it('does not let unstable neutral hues control the fit', () => {
    const fit = fitHarmony([color(30), color(210), color(100, 0.01)], 'complementary');
    expect(fit.meanMovement).toBeLessThan(0.01);
  });
  it('honors an exact noninteger anchor hue', () => {
    const fit = fitHarmony([color(31.7), color(195)], 'complementary', 0);
    expect(fit.targets[0]).toBeCloseTo(31.7);
  });
  it('rejects palettes without meaningful chromatic evidence', () => {
    expect(rankHarmonies([color(0, 0), color(200, 0.01)])).toEqual([]);
  });
  it('prefers simpler templates when more axes only fit unused slots', () => {
    expect(rankHarmonies([color(20), color(200)])[0]?.kind).toBe('complementary');
  });
});

describe('nudges', () => {
  it('preserves saturation and lightness and interpolates along the short arc', () => {
    const nudge = suggestNudge(color(350, 0.6, 0.4), {
      targetHue: 10,
      strength: 0.5,
      maxShift: 40,
      tolerance: 0,
    });
    expect(nudge.color).toEqual(color(0, 0.6, 0.4));
    expect(nudge.delta).toBe(10);
  });
  it('limits large moves and protects near neutrals', () => {
    expect(suggestNudge(color(30), { targetHue: 150, strength: 1, maxShift: 30, tolerance: 0 }).delta).toBe(
      30,
    );
    expect(
      suggestNudge(color(30, 0.01), { targetHue: 150, strength: 1, maxShift: 30, tolerance: 0 }).delta,
    ).toBe(0);
  });
  it('does not move colors inside tolerance or when strength is zero', () => {
    expect(suggestNudge(color(30), { targetHue: 34, strength: 1, maxShift: 40, tolerance: 5 }).delta).toBe(0);
    expect(suggestNudge(color(30), { targetHue: 100, strength: 0, maxShift: 40, tolerance: 0 }).delta).toBe(
      0,
    );
  });
});

describe('harmony edge cases', () => {
  it.each(['monochromatic', 'complementary', 'split-complementary', 'triadic', 'square'] as const)(
    'fits an exact %s template',
    (kind) => {
      const offsets = {
        monochromatic: [0],
        complementary: [0, 180],
        'split-complementary': [0, 150, 210],
        triadic: [0, 120, 240],
        square: [0, 90, 180, 270],
      };
      const colors = offsets[kind].map((offset) => color((offset + 19.7) % 360));
      expect(fitHarmony(colors, kind).meanMovement).toBeLessThan(0.01);
    },
  );
  it('ignores an unusable neutral anchor including sub-degree refinement', () => {
    const colors = [color(31.7), color(211.7), color(100, 0.01)];
    expect(fitHarmony(colors, 'complementary', 2).meanMovement).toBeLessThan(0.01);
  });
  it('centers an analogous arc on the locked hue and projects outliers to the edge', () => {
    const fit = fitHarmony([color(10), color(70), color(350)], 'analogous', 0);
    expect(fit.targets).toEqual([10, 40, 350]);
  });
  it('returns no ranked harmonies for an empty palette', () => {
    expect(rankHarmonies([])).toEqual([]);
  });
  it('applies the move cap before strength and preserves a locked color', () => {
    const options = { targetHue: 100, strength: 0.5, maxShift: 20, tolerance: 0 };
    expect(suggestNudge(color(40), options).delta).toBe(10);
    expect(suggestNudge(color(40), { ...options, isLocked: true }).delta).toBe(0);
  });
  it('treats low-chroma near-black colors as neutral even when saturation is high', () => {
    expect(
      suggestNudge(color(20, 1, 0.005), { targetHue: 100, strength: 1, maxShift: 40, tolerance: 0 }).delta,
    ).toBe(0);
  });
});
