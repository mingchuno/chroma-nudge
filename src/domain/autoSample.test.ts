import { describe, expect, it } from 'vitest';
import { extractPhotoSamples } from './autoSample';
import { hslToHex } from './color';
import { type PhotoPixels, samplePhoto } from './photo';

function stripedPhoto(colors: number[][], width = 240, height = 80): PhotoPixels {
  const pixels = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rgb = colors[Math.min(colors.length - 1, Math.floor((x / width) * colors.length))] ?? [];
      pixels.set([...rgb, 255], (y * width + x) * 4);
    }
  }
  return { width, height, pixels: { data: pixels } };
}

describe('automatic photo sampling', () => {
  it('finds distinct major colors, including white and black, at actual sample positions', () => {
    const photo = stripedPhoto([
      [255, 0, 0],
      [0, 0, 255],
      [255, 255, 255],
      [0, 0, 0],
    ]);
    const samples = extractPhotoSamples(photo, 6);
    expect(samples.map((sample) => hslToHex(sample.color)).sort()).toEqual([
      '#000000',
      '#0000FF',
      '#FF0000',
      '#FFFFFF',
    ]);
    for (const sample of samples) {
      expect(sample.x).toBeGreaterThanOrEqual(0);
      expect(sample.x).toBeLessThanOrEqual(1);
      expect(sample.y).toBeGreaterThanOrEqual(0);
      expect(sample.y).toBeLessThanOrEqual(1);
      expect(sample.color).toEqual(samplePhoto(photo, sample));
    }
    expect(extractPhotoSamples(photo, 6)).toEqual(samples);
  });

  it('returns one sample for a flat image rather than inventing extra colors', () => {
    expect(
      extractPhotoSamples(stripedPhoto([[90, 90, 90]]), 5).map((sample) => hslToHex(sample.color)),
    ).toEqual(['#5A5A5A']);
  });

  it('merges near-identical colors but preserves meaningful lightness differences', () => {
    const samples = extractPhotoSamples(
      stripedPhoto([
        [90, 90, 90],
        [92, 92, 92],
        [210, 210, 210],
      ]),
      6,
    );
    expect(samples).toHaveLength(2);
    expect(samples.some((sample) => sample.color.l > 0.8)).toBe(true);
    expect(samples.some((sample) => sample.color.l < 0.4)).toBe(true);
  });

  it('honors the requested maximum and ranks dominant regions first', () => {
    const photo = stripedPhoto([
      [255, 0, 0],
      [255, 0, 0],
      [255, 0, 0],
      [0, 0, 255],
      [0, 255, 0],
    ]);
    expect(hslToHex(extractPhotoSamples(photo, 4)[0]?.color ?? { h: 0, s: 0, l: 0 })).toBe('#FF0000');
    const colorful = stripedPhoto(
      [
        [255, 0, 0],
        [0, 255, 0],
        [0, 0, 255],
        [255, 255, 0],
        [0, 255, 255],
        [255, 0, 255],
      ],
      600,
    );
    for (const count of [4, 5, 6] as const) expect(extractPhotoSamples(colorful, count)).toHaveLength(count);
  });

  it('handles a one-pixel image and narrow images', () => {
    for (const [width, height] of [
      [1, 1],
      [1, 100],
      [100, 1],
    ]) {
      expect(extractPhotoSamples(stripedPhoto([[255, 0, 0]], width, height), 5)).toHaveLength(1);
    }
  });
});
