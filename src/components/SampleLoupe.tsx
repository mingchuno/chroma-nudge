import { useLayoutEffect, useRef } from 'react';
import { hslToHex } from '../domain/color';
import type { Photo, Sample } from '../domain/photo';
import styles from './SampleLoupe.module.css';

interface Props {
  photo: Photo;
  sample: Sample;
  position: { x: number; y: number };
}

const SIZE = 120;
const PIXELS = 25;
const SCALE = SIZE / PIXELS;
const HEIGHT = 152;
const GAP = 28;
const MARGIN = 8;

export function SampleLoupe({ photo, sample, position }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const x = Math.round(sample.x * (photo.width - 1));
  const y = Math.round(sample.y * (photo.height - 1));
  useLayoutEffect(() => {
    const context = canvas.current?.getContext('2d');
    if (!context) return;
    // Copy only the nearby pixels; never redraw the full photograph during a drag.
    const crop = document.createElement('canvas');
    crop.width = PIXELS;
    crop.height = PIXELS;
    const cropContext = crop.getContext('2d');
    if (!cropContext) return;
    cropContext.putImageData(photo.pixels, 12 - x, 12 - y);
    context.clearRect(0, 0, SIZE, SIZE);
    context.imageSmoothingEnabled = false;
    context.drawImage(crop, 0, 0, SIZE, SIZE);
    const left = (Math.max(0, x - 2) - x + 12) * SCALE;
    const top = (Math.max(0, y - 2) - y + 12) * SCALE;
    const width = (Math.min(photo.width - 1, x + 2) - Math.max(0, x - 2) + 1) * SCALE;
    const height = (Math.min(photo.height - 1, y + 2) - Math.max(0, y - 2) + 1) * SCALE;
    context.lineWidth = 3;
    context.strokeStyle = '#253b30';
    context.strokeRect(left, top, width, height);
    context.lineWidth = 1;
    context.strokeStyle = '#ffffff';
    context.strokeRect(left, top, width, height);
    for (const color of ['#253b30', '#ffffff']) {
      context.strokeStyle = color;
      context.lineWidth = color === '#ffffff' ? 1 : 3;
      context.beginPath();
      context.moveTo(54, 60);
      context.lineTo(66, 60);
      context.moveTo(60, 54);
      context.lineTo(60, 66);
      context.stroke();
    }
  }, [photo, x, y]);

  const left = Math.max(MARGIN, Math.min(window.innerWidth - SIZE - MARGIN, position.x - SIZE / 2));
  const above = position.y - HEIGHT - GAP;
  const top = Math.max(
    MARGIN,
    Math.min(window.innerHeight - HEIGHT - MARGIN, above >= MARGIN ? above : position.y + GAP),
  );
  const hex = hslToHex(sample.color);
  return (
    <div className={styles.loupe} style={{ left, top }} data-testid="sample-loupe" aria-hidden="true">
      <canvas ref={canvas} width={SIZE} height={SIZE} className={styles.preview} />
      <div className={styles.color}>
        <span className={styles.swatch} style={{ background: hex }} />
        {hex}
      </div>
    </div>
  );
}
