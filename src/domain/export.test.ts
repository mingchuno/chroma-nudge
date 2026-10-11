import { describe, expect, it } from 'vitest';
import { buildReference } from './export';
import { referenceSvg } from './referenceSheet';

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
