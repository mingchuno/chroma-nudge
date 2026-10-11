import { describe, expect, it } from 'vitest';
import { hslToHex } from './color';
import { type Photo, samplePhoto } from './photo';

describe('photo sampling', () => {
  it('averages the available pixels and clamps image edge positions', () => {
    const photo = {
      width: 2,
      height: 1,
      pixels: { data: new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 255, 255]) },
    } as Photo;
    expect(hslToHex(samplePhoto(photo, { x: 0, y: 0 }))).toBe('#800080');
    expect(hslToHex(samplePhoto(photo, { x: 1.5, y: -1 }))).toBe('#800080');
  });
});
