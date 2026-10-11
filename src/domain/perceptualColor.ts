import type { Hsl, Rgb } from './color';
import { hslToRgb } from './color';
import { SIMILAR_COLOR_DISTANCE_SQUARED } from './samplingPolicy';

export interface Oklab {
  l: number;
  a: number;
  b: number;
}

function linearChannel(channel: number): number {
  const value = channel / 255;
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

// Linear-sRGB conversion from https://bottosson.github.io/posts/oklab/ (public domain).
export function rgbToOklab(rgb: Rgb): Oklab {
  const r = linearChannel(rgb.r);
  const g = linearChannel(rgb.g);
  const b = linearChannel(rgb.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

export function colorDistanceSquared(left: Oklab, right: Oklab): number {
  return (left.l - right.l) ** 2 + (left.a - right.a) ** 2 + (left.b - right.b) ** 2;
}

export function areSimilarColors(left: Hsl, right: Hsl): boolean {
  return (
    colorDistanceSquared(rgbToOklab(hslToRgb(left)), rgbToOklab(hslToRgb(right))) <
    SIMILAR_COLOR_DISTANCE_SQUARED
  );
}
