import type { Reference } from '../domain/export';
import { referenceSvg } from '../domain/referenceSheet';

export async function referencePng(reference: Reference): Promise<Blob> {
  const url = URL.createObjectURL(new Blob([referenceSvg(reference)], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth * 2;
    canvas.height = image.naturalHeight * 2;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create the reference sheet canvas.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Could not encode the reference sheet as PNG.'));
      }, 'image/png');
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}
