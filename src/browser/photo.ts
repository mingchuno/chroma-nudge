import { type Photo, type Sample, samplePhoto } from '../domain/photo';

export async function decodePhoto(file: File): Promise<Photo> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type))
    throw new Error('Choose a JPEG, PNG, WebP, or AVIF image.');
  if (file.size > 40 * 1024 * 1024)
    throw new Error('This file is over 40 MB. Export a smaller JPEG or PNG and try again.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('The browser could not read this image. Try exporting it as JPEG or PNG.');
  }
  try {
    if (bitmap.width * bitmap.height > 60_000_000)
      throw new Error('This image is over 60 megapixels. Export a smaller copy and try again.');
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Canvas is unavailable in this browser.');
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return {
      name: file.name,
      width: canvas.width,
      height: canvas.height,
      url: canvas.toDataURL('image/png'),
      pixels: context.getImageData(0, 0, canvas.width, canvas.height),
    };
  } finally {
    bitmap.close();
  }
}

export function createDemo(): { photo: Photo; samples: Sample[] } {
  const canvas = document.createElement('canvas');
  canvas.width = 960;
  canvas.height = 720;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas is unavailable in this browser.');
  const swatches = ['#D3A878', '#8B9BA8', '#3F4E36', '#E5DED3', '#746875', '#615044'];
  swatches.forEach((hex, index) => {
    const x = (index % 3) * 320;
    const y = Math.floor(index / 3) * 360;
    context.fillStyle = hex;
    context.fillRect(x, y, 320, 360);
  });
  const photo = {
    name: 'Six-color study (demo)',
    url: canvas.toDataURL(),
    width: 960,
    height: 720,
    pixels: context.getImageData(0, 0, 960, 720),
  };
  const names = ['Warm stone', 'Cool sky', 'Foliage', 'Soft white', 'Muted violet', 'Earth'];
  const samples = swatches.map((_, index) => {
    const position = { x: ((index % 3) + 0.5) / 3, y: (Math.floor(index / 3) + 0.5) / 2 };
    return { id: index + 1, ...position, name: names[index] ?? '', color: samplePhoto(photo, position) };
  });
  return { photo, samples };
}
