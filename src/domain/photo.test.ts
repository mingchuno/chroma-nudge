import { describe, expect, it } from 'vitest';
import { hslToHex } from './color';
import { buildReference, referenceSvg } from './export';
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

describe('reference export', () => {
  it('escapes labels as text and excludes the photo pixels', () => {
    const reference = buildReference(
      [
        {
          id: 1,
          name: '<script>alert(1)</script>',
          x: 0.5,
          y: 0.5,
          color: { h: 30, s: 0.5, l: 0.5 },
          customHue: 50,
        },
      ],
      { custom: true, strength: 0.5, maxShift: 30, tolerance: 0, intention: 'A & B', photoName: 'test.png' },
    );
    expect(referenceSvg(reference)).toContain('&lt;script&gt;');
    expect(referenceSvg(reference)).not.toContain('<script>');
    expect(referenceSvg(reference)).toContain('A &amp; B');
    expect(JSON.stringify(reference)).not.toContain('data:image');
    expect(reference.meanRequiredHueMovement).toBeNull();
  });
});
