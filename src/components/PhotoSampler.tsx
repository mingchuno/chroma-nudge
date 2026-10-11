import { type KeyboardEvent, type PointerEvent, useRef } from 'react';
import { hslToHex } from '../domain/color';
import type { Photo, Sample } from '../domain/photo';
import styles from './Workspace.module.css';

interface Props {
  photo: Photo;
  samples: Sample[];
  selectedId?: number;
  onPlace: (position: { x: number; y: number }, id?: number) => number | undefined;
  onSelect: (id: number) => void;
}

export function PhotoSampler({ photo, samples, selectedId, onPlace, onSelect }: Props) {
  const surface = useRef<HTMLFieldSetElement>(null);
  const draggedId = useRef<number | undefined>(undefined);

  function position(event: PointerEvent) {
    const bounds = surface.current?.getBoundingClientRect();
    if (!bounds) return { x: 0.5, y: 0.5 };
    return {
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    };
  }
  function start(event: PointerEvent<HTMLFieldSetElement>) {
    if (event.button !== 0) return;
    const point = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-sample-id]');
    const id = point ? Number(point.dataset.sampleId) : undefined;
    draggedId.current = onPlace(position(event), id);
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function movePoint(event: KeyboardEvent<HTMLButtonElement>, sample: Sample) {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0],
      ArrowRight: [1, 0],
      ArrowUp: [0, -1],
      ArrowDown: [0, 1],
    };
    const delta = directions[event.key];
    if (!delta) return;
    event.preventDefault();
    event.stopPropagation();
    const step = event.shiftKey ? 10 : 1;
    onPlace(
      {
        x: Math.max(0, Math.min(1, sample.x + (delta[0] * step) / photo.width)),
        y: Math.max(0, Math.min(1, sample.y + (delta[1] * step) / photo.height)),
      },
      sample.id,
    );
  }
  return (
    <div className={styles.photoFrame}>
      <fieldset
        ref={surface}
        className={styles.photoSurface}
        style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        aria-label="Photo sampler. Use Add center sample, then arrow keys on sample buttons to move them."
        onPointerDown={start}
        onPointerMove={(event) => {
          if (draggedId.current !== undefined) onPlace(position(event), draggedId.current);
        }}
        onPointerUp={() => {
          draggedId.current = undefined;
        }}
        onPointerCancel={() => {
          draggedId.current = undefined;
        }}
      >
        <img src={photo.url} alt={photo.name} draggable={false} />
        {samples.map((sample, index) => (
          <button
            key={sample.id}
            type="button"
            data-sample-id={sample.id}
            className={`${styles.photoPoint} ${selectedId === sample.id ? styles.selectedPoint : ''}`}
            style={{
              left: `${sample.x * 100}%`,
              top: `${sample.y * 100}%`,
              background: hslToHex(sample.color),
            }}
            aria-label={`Sample ${index + 1}: ${sample.name || 'unnamed'}. Use arrow keys to move.`}
            onFocus={() => onSelect(sample.id)}
            onClick={() => onSelect(sample.id)}
            onKeyDown={(event) => movePoint(event, sample)}
          >
            {index + 1}
          </button>
        ))}
      </fieldset>
    </div>
  );
}
