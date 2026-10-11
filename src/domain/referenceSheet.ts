import type { Reference } from './export';

const escapeXml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
export function referenceSvg(reference: Reference): string {
  const height = 230 + reference.samples.length * 90;
  const rows = reference.samples
    .map((sample, index) => {
      const y = 200 + index * 90;
      return `<g transform="translate(36 ${y})"><rect width="44" height="44" fill="${sample.original}"/><rect x="50" width="44" height="44" fill="${sample.suggested}"/><text x="116" y="17" font-size="16">${sample.number}. ${escapeXml(sample.name.slice(0, 55))}</text><text x="116" y="41" font-size="13">${sample.original} → ${sample.suggested} · ${sample.hueShift.toFixed(1)}° · ${escapeXml(sample.direction)}</text></g>`;
    })
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="${height}" viewBox="0 0 800 ${height}"><rect width="800" height="${height}" fill="#f4f1e9"/><g fill="#24372d" font-family="sans-serif"><text x="36" y="48" font-size="28">Chroma Nudge / ${escapeXml(reference.harmony)}</text><text x="36" y="80" font-size="15">${escapeXml(reference.photo.slice(0, 75))}</text><text x="36" y="113" font-size="14">${escapeXml(reference.intention.slice(0, 85))}</text><text x="36" y="145" font-size="12">Original → Suggested · HSL hue reference · strength ${Math.round(reference.settings.strength * 100)}%</text><text x="36" y="170" font-size="12">Hue degrees are not editing slider values. Original photo is unchanged.</text>${rows}</g></svg>`;
}
