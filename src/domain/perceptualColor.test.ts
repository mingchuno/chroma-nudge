import { describe, expect, it } from 'vitest';
import { areSimilarColors, rgbToOklab } from './perceptualColor';

describe('perceptual colors', () => {
  it('converts sRGB primaries and neutral endpoints to Oklab', () => {
    const red = rgbToOklab({ r: 255, g: 0, b: 0 });
    expect(red.l).toBeCloseTo(0.627955, 5);
    expect(red.a).toBeCloseTo(0.224863, 5);
    expect(red.b).toBeCloseTo(0.125846, 5);
    expect(rgbToOklab({ r: 0, g: 0, b: 0 })).toEqual({ l: 0, a: 0, b: 0 });
    const white = rgbToOklab({ r: 255, g: 255, b: 255 });
    expect(white.l).toBeCloseTo(1, 5);
    expect(white.a).toBeCloseTo(0, 5);
    expect(white.b).toBeCloseTo(0, 5);
  });

  it('compares hue across the wrap and distinguishes light and dark neutrals', () => {
    expect(areSimilarColors({ h: 359, s: 1, l: 0.5 }, { h: 1, s: 1, l: 0.5 })).toBe(true);
    expect(areSimilarColors({ h: 0, s: 0, l: 0.2 }, { h: 0, s: 0, l: 0.8 })).toBe(false);
  });
});
