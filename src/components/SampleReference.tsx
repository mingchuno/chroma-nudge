import { downloadFile } from '../browser/download';
import { referencePng } from '../browser/referencePng';
import { hueName } from '../domain/color';
import { buildReference, type ReferenceOptions } from '../domain/export';
import type { Sample } from '../domain/photo';
import { referenceSvg } from '../domain/referenceSheet';
import { analyzeSample } from '../domain/sampleAnalysis';
import styles from './SampleReference.module.css';
import sharedStyles from './Shared.module.css';

interface Props {
  samples: Sample[];
  selectedId?: number;
  options: ReferenceOptions;
  onSelect: (id: number) => void;
  onAnchor: (id?: number) => void;
  onUpdate: (id: number, updates: Partial<Pick<Sample, 'name' | 'customHue'>>) => void;
  onRemove: (id: number) => void;
  onCopy: (hex: string) => Promise<void>;
  onMessage: (message: string) => void;
}
export function SampleReference({
  samples,
  selectedId,
  options,
  onSelect: setSelectedId,
  onAnchor: setAnchorId,
  onUpdate: updateSample,
  onRemove: removeSample,
  onCopy: copyHex,
  onMessage: setMessage,
}: Props) {
  const { anchorId } = options;
  const reference = buildReference(samples, options);
  return (
    <section className={styles.referenceColumn} aria-labelledby="reference-title">
      <div className={sharedStyles.sectionTitle}>
        <h2 id="reference-title">Your edit reference</h2>
      </div>
      <details className={styles.referenceHelp}>
        <summary>Reading & using this reference</summary>
        <p>Name each region. Anchor one color to keep it steady while the harmony fits around it.</p>
        <p>
          Original colors are on the left; suggested colors are on the right. Click a hex value to copy it.
        </p>
      </details>
      {!samples.length && (
        <p className={styles.sampleEmpty}>
          Your sampled colors will appear here.
          <br />
          Start with the subject you care about most.
        </p>
      )}
      <ol className={styles.samples}>
        {samples.map((sample, index) => {
          const { targetHue, nudge, original, suggested, protectedNeutral } = analyzeSample(
            sample,
            index,
            options,
          );
          return (
            <li key={sample.id} className={selectedId === sample.id ? styles.activeSample : ''}>
              <div className={styles.sampleHeading}>
                <button
                  className={styles.sampleNumber}
                  type="button"
                  aria-label={`Select sample ${index + 1}`}
                  aria-pressed={selectedId === sample.id}
                  onClick={() => setSelectedId(sample.id)}
                >
                  {index + 1}
                </button>
                <input
                  aria-label={`Name sample ${index + 1}`}
                  value={sample.name}
                  placeholder={`Name sample ${index + 1}`}
                  maxLength={60}
                  onFocus={() => setSelectedId(sample.id)}
                  onChange={(event) => updateSample(sample.id, { name: event.target.value })}
                />
                <button
                  type="button"
                  className={styles.removeButton}
                  aria-label={`Remove sample ${index + 1}`}
                  onClick={() => removeSample(sample.id)}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="m4 4 8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              </div>
              <div className={styles.swatchLine}>
                <span className={styles.swatch} style={{ background: original }} />
                <button
                  type="button"
                  className={styles.hex}
                  onClick={() => void copyHex(original)}
                  aria-label={`Copy original ${original}`}
                >
                  {original}
                </button>
                <span className={styles.swatchArrow} aria-hidden="true">
                  →
                </span>
                <span className={styles.swatch} style={{ background: suggested }} />
                <button
                  type="button"
                  className={styles.hex}
                  onClick={() => void copyHex(suggested)}
                  aria-label={`Copy suggested ${suggested}`}
                >
                  {suggested}
                </button>
              </div>
              <p className={styles.colorValues}>
                H {protectedNeutral ? '—' : `${sample.color.h.toFixed(0)}°`} · S{' '}
                {Math.round(sample.color.s * 100)}% · L {Math.round(sample.color.l * 100)}%
              </p>
              <div className={styles.sampleFoot}>
                <p>
                  {sample.id === anchorId
                    ? 'Anchor · keep this color'
                    : protectedNeutral
                      ? 'Near-neutral · keep'
                      : nudge.isAligned
                        ? 'Aligned · keep'
                        : `${nudge.delta >= 0 ? '+' : ''}${nudge.delta.toFixed(1)}° toward ${hueName(targetHue)}${nudge.isLimited ? ' · capped' : ''}`}
                </p>
                <button
                  type="button"
                  className={styles.anchorButton}
                  disabled={protectedNeutral}
                  aria-pressed={anchorId === sample.id}
                  aria-label={`${anchorId === sample.id ? 'Release' : 'Anchor'} sample ${index + 1}`}
                  onClick={() => setAnchorId(anchorId === sample.id ? undefined : sample.id)}
                >
                  {anchorId === sample.id ? 'Release' : 'Anchor'}
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <div className={styles.exportArea}>
        <p>Keep this study beside your editor.</p>
        <button
          type="button"
          className={sharedStyles.primary}
          disabled={!samples.length}
          onClick={async () => {
            try {
              const png = await referencePng(reference);
              downloadFile(png, 'chroma-nudge-reference.png', 'image/png');
              setMessage('Reference sheet exported. Open it in a browser or image viewer.');
            } catch {
              setMessage('Could not export PNG. Try again or export as SVG.');
            }
          }}
        >
          Export reference sheet
        </button>
        <button
          type="button"
          className={`${sharedStyles.textButton} ${styles.exportLink}`}
          disabled={!samples.length}
          onClick={() => {
            downloadFile(referenceSvg(reference), 'chroma-nudge-reference.svg', 'image/svg+xml');
            setMessage('Reference sheet exported as SVG.');
          }}
        >
          Export as SVG
        </button>
        <button
          type="button"
          className={`${sharedStyles.textButton} ${styles.exportLink}`}
          disabled={!samples.length}
          onClick={() => {
            downloadFile(
              JSON.stringify(reference, null, 2),
              'chroma-nudge-reference.json',
              'application/json',
            );
            setMessage('Full study exported as JSON.');
          }}
        >
          Export full study as JSON
        </button>
      </div>
    </section>
  );
}
