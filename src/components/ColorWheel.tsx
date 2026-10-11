import { type PointerEvent, useRef } from 'react';
import { hasMeaningfulHue, hslToHex, wrapHue } from '../domain/color';
import type { HarmonyFit } from '../domain/harmony';
import { templates } from '../domain/harmony';
import type { WheelMode } from '../domain/harmonyControls';
import type { Sample } from '../domain/photo';
import styles from './ColorWheel.module.css';

interface Props {
  samples: Sample[];
  fit?: HarmonyFit;
  mode: WheelMode;
  selectedId?: number;
  custom: boolean;
  onSelect: (id: number) => void;
  onCustomHue: (id: number, hue: number) => void;
}
const coordinate = (hue: number, radius: number) => ({
  x: 200 + Math.cos((hue * Math.PI) / 180) * radius,
  y: 200 - Math.sin((hue * Math.PI) / 180) * radius,
});

export function ColorWheel({ samples, fit, mode, selectedId, custom, onSelect, onCustomHue }: Props) {
  const draggedId = useRef<number | undefined>(undefined);
  function drag(event: PointerEvent<SVGSVGElement>) {
    if (draggedId.current === undefined) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    onCustomHue(draggedId.current, wrapHue((Math.atan2(-y, x) * 180) / Math.PI));
  }
  const targetAxes =
    fit && !custom ? templates[fit.kind].offsets.map((offset) => wrapHue(fit.rotation + offset)) : [];
  return (
    <div className={styles.wheelOuter}>
      <div className={styles.wheelColor} />
      <svg
        viewBox="0 0 400 400"
        className={styles.wheelSvg}
        aria-label="HSL color wheel: hue is angle, saturation is radius"
        onPointerMove={drag}
        onPointerUp={() => {
          draggedId.current = undefined;
        }}
        onPointerCancel={() => {
          draggedId.current = undefined;
        }}
      >
        <title>Sampled hues and harmony targets</title>
        <defs>
          <marker
            id="nudge-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#262c28" />
          </marker>
        </defs>
        {[0.25, 0.5, 0.75, 1].map((radius) => (
          <circle
            key={radius}
            cx="200"
            cy="200"
            r={radius * 180}
            fill="none"
            stroke="#262c28"
            strokeOpacity="0.13"
          />
        ))}
        {mode === 'guide' &&
          targetAxes.map((hue) => {
            const point = coordinate(hue, 180);
            return (
              <line
                key={hue}
                x1="200"
                y1="200"
                x2={point.x}
                y2={point.y}
                stroke="#262c28"
                strokeDasharray="3 5"
                strokeOpacity="0.5"
              />
            );
          })}
        {mode === 'guide' &&
          samples.map((sample, index) => {
            if (!hasMeaningfulHue(sample.color)) return null;
            const hue = custom
              ? (sample.customHue ?? sample.color.h)
              : (fit?.targets[index] ?? sample.color.h);
            const source = coordinate(sample.color.h, 163);
            const target = coordinate(hue, 180);
            return (
              <g key={sample.id}>
                {Math.abs(hue - sample.color.h) > 0.5 && (
                  <line
                    x1={source.x}
                    y1={source.y}
                    x2={target.x}
                    y2={target.y}
                    stroke="#262c28"
                    strokeWidth="1.5"
                    markerEnd="url(#nudge-arrow)"
                  />
                )}
                <circle
                  cx={target.x}
                  cy={target.y}
                  r="9"
                  fill={hslToHex({ h: hue, s: 0.7, l: 0.7 })}
                  stroke="#262c28"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  style={{ cursor: custom ? 'grab' : 'default' }}
                  onPointerDown={(event) => {
                    if (!custom) return;
                    event.stopPropagation();
                    draggedId.current = sample.id;
                    onSelect(sample.id);
                    event.currentTarget.ownerSVGElement?.setPointerCapture(event.pointerId);
                  }}
                />
              </g>
            );
          })}
        {samples.map((sample, index) => {
          const meaningful = hasMeaningfulHue(sample.color);
          const point = coordinate(
            sample.color.h,
            !meaningful ? 0 : mode !== 'natural' ? 163 : sample.color.s * 180,
          );
          return (
            <g key={sample.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={selectedId === sample.id ? 15 : 12}
                fill={hslToHex(sample.color)}
                stroke="white"
                strokeWidth="2.5"
              />
              <text
                x={point.x}
                y={point.y + 4}
                textAnchor="middle"
                fontSize="11"
                fontWeight="700"
                fill={sample.color.l > 0.55 ? '#1f2622' : '#ffffff'}
              >
                {index + 1}
              </text>
            </g>
          );
        })}
        {[
          ['R', 0],
          ['Y', 60],
          ['G', 120],
          ['C', 180],
          ['B', 240],
          ['M', 300],
        ].map(([label, hue]) => {
          const point = coordinate(Number(hue), 195);
          return (
            <text key={label} x={point.x} y={point.y + 4} textAnchor="middle" fontSize="10" fill="#4e584f">
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
