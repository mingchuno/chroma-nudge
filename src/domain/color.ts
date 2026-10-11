export interface Rgb {
  r: number;
  g: number;
  b: number;
}
export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export const wrapHue = (hue: number) => ((hue % 360) + 360) % 360;
export const signedHueDelta = (from: number, to: number) => ((to - from + 540) % 360) - 180;
export const chroma = ({ s, l }: Hsl) => s * (1 - Math.abs(2 * l - 1));
export const hasMeaningfulHue = (color: Hsl) => chroma(color) >= 0.025;

export function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const red = r / 255;
  const green = g / 255;
  const blue = b / 255;
  const high = Math.max(red, green, blue);
  const low = Math.min(red, green, blue);
  const difference = high - low;
  const l = (high + low) / 2;
  if (difference === 0) return { h: 0, s: 0, l };
  const sector =
    high === red
      ? (green - blue) / difference
      : high === green
        ? (blue - red) / difference + 2
        : (red - green) / difference + 4;
  return { h: wrapHue(sector * 60), s: difference / (1 - Math.abs(2 * l - 1)), l };
}

export function hslToRgb({ h, s, l }: Hsl): Rgb {
  const amplitude = s * Math.min(l, 1 - l);
  const channel = (offset: number) => {
    const phase = (offset + wrapHue(h) / 30) % 12;
    return Math.round(255 * (l - amplitude * Math.max(-1, Math.min(phase - 3, 9 - phase, 1))));
  };
  return { r: channel(0), g: channel(8), b: channel(4) };
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()}`;
}
export const hslToHex = (color: Hsl) => rgbToHex(hslToRgb(color));

export function hueName(hue: number): string {
  const names = [
    'red',
    'orange',
    'yellow',
    'yellow-green',
    'green',
    'teal',
    'cyan',
    'sky blue',
    'blue',
    'violet',
    'magenta',
    'rose',
  ];
  return names[Math.round(wrapHue(hue) / 30) % 12] ?? 'red';
}
