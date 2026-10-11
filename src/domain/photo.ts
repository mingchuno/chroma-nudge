import { type Hsl, type Rgb, rgbToHsl } from './color';

export interface PhotoPixels {
  width: number;
  height: number;
  pixels: { data: Uint8ClampedArray };
}
export interface Photo extends PhotoPixels {
  pixels: ImageData;
  url: string;
  name: string;
}
export interface Sample {
  id: number;
  x: number;
  y: number;
  name: string;
  color: Hsl;
  customHue?: number;
}

export function samplePhoto(photo: PhotoPixels, position: { x: number; y: number }): Hsl {
  return rgbToHsl(samplePhotoRgb(photo, position));
}

export function samplePhotoRgb(photo: PhotoPixels, position: { x: number; y: number }): Rgb {
  const x = Math.min(photo.width - 1, Math.max(0, Math.round(position.x * (photo.width - 1))));
  const y = Math.min(photo.height - 1, Math.max(0, Math.round(position.y * (photo.height - 1))));
  let red = 0;
  let green = 0;
  let blue = 0;
  let count = 0;
  for (let py = Math.max(0, y - 2); py <= Math.min(photo.height - 1, y + 2); py++) {
    for (let px = Math.max(0, x - 2); px <= Math.min(photo.width - 1, x + 2); px++) {
      const index = (py * photo.width + px) * 4;
      red += photo.pixels.data[index] ?? 0;
      green += photo.pixels.data[index + 1] ?? 0;
      blue += photo.pixels.data[index + 2] ?? 0;
      count++;
    }
  }
  return { r: red / count, g: green / count, b: blue / count };
}
