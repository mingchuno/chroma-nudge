import { templates } from '../domain/harmony';
import type { HarmonyActions, HarmonyView, Selection, WheelMode } from '../domain/harmonyControls';
import { ColorWheel } from './ColorWheel';
import styles from './HarmonyPanel.module.css';
import sharedStyles from './Shared.module.css';

interface Props {
  view: HarmonyView;
  actions: HarmonyActions;
}
export function HarmonyPanel({ view, actions }: Props) {
  const {
    samples,
    fit,
    mode,
    isCustom,
    selectedId,
    selected,
    chromaticCount,
    selection,
    strength,
    maxShift,
    tolerance,
    rankings,
  } = view;
  const {
    selectSample: setSelectedId,
    updateSample,
    changeMode: setMode,
    chooseHarmony,
    changeStrength: setStrength,
    changeMaxShift: setMaxShift,
    changeTolerance: setTolerance,
  } = actions;
  return (
    <section className={styles.wheelColumn} aria-labelledby="wheel-title">
      <div className={sharedStyles.sectionTitle}>
        <h2 id="wheel-title">Read the color</h2>
        <span>HSL wheel</span>
      </div>
      <ColorWheel
        samples={samples}
        fit={fit}
        mode={mode}
        custom={isCustom}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onCustomHue={(id, hue) => updateSample(id, { customHue: hue })}
      />
      <fieldset className={styles.segmented} aria-label="Wheel display">
        {(['natural', 'pure', 'guide'] as WheelMode[]).map((value) => (
          <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>
            {value === 'natural' ? 'Natural' : value === 'pure' ? 'Pure hues' : 'Harmony guide'}
          </button>
        ))}
      </fieldset>
      <p className={sharedStyles.caption}>
        {mode === 'natural'
          ? 'Angle is hue. Distance from center is HSL saturation.'
          : mode === 'pure'
            ? 'Chromatic colors move to the rim to reveal their hue relationships.'
            : 'Dashed targets show the full fit. Arrows show the path toward it.'}{' '}
        Near-neutrals are not used for fitting.
      </p>
      <div className={styles.harmonySummary}>
        <h3>
          {!chromaticCount
            ? 'A little more color is needed.'
            : isCustom
              ? 'Your own color direction.'
              : `${fit ? templates[fit.kind].name : 'Harmony'}${selection === 'auto' ? ' is the closest fit.' : '.'}`}
        </h3>
        <p>
          {!chromaticCount
            ? 'Sample a more colorful region to explore harmony.'
            : fit && !isCustom
              ? `${fit.meanMovement.toFixed(1)}° average hue movement to the full target, weighted by RGB chroma. ${chromaticCount < 3 ? 'Add more distinct colors for a stronger comparison.' : 'A geometric fit, not a judgment of beauty.'}`
              : 'Select a sample, drag its dashed target, or enter a target hue below.'}
        </p>
      </div>
      <label className={styles.field}>
        Harmony
        <select value={selection} onChange={(event) => chooseHarmony(event.target.value as Selection)}>
          <option value="auto">Suggest closest harmony</option>
          {Object.entries(templates).map(([kind, template]) => (
            <option key={kind} value={kind}>
              {template.name}
            </option>
          ))}
          <option value="custom">Custom targets</option>
        </select>
      </label>
      <p className={styles.controlNote}>
        {isCustom
          ? 'Custom targets are independent. The anchor stays unchanged.'
          : fit
            ? templates[fit.kind].description
            : 'Select a harmony or add a chromatic sample.'}
      </p>
      {isCustom && selected && (
        <label className={styles.field}>
          Target hue for sample {samples.indexOf(selected) + 1}
          <input
            type="number"
            min="0"
            max="359.9"
            step="0.1"
            value={Math.round((selected.customHue ?? selected.color.h) * 10) / 10}
            onChange={(event) => {
              const hue = Number(event.target.value);
              if (Number.isFinite(hue))
                updateSample(selected.id, { customHue: Math.max(0, Math.min(359.9, hue)) });
            }}
          />
        </label>
      )}
      <div className={styles.sliderGroup}>
        <label>
          Nudge strength <output>{Math.round(strength * 100)}%</output>
          <input
            aria-label="Nudge strength"
            type="range"
            min="0"
            max="100"
            value={strength * 100}
            onChange={(event) => setStrength(Number(event.target.value) / 100)}
          />
        </label>
        <details className={`${sharedStyles.details} ${styles.panelDetails}`}>
          <summary>Fine-tune the nudge</summary>
          <div className={styles.twoControls}>
            <label>
              Maximum move <output>{maxShift}°</output>
              <input
                aria-label="Maximum move"
                type="range"
                min="5"
                max="180"
                step="5"
                value={maxShift}
                onChange={(event) => setMaxShift(Number(event.target.value))}
              />
            </label>
            <label>
              Aligned within <output>{tolerance}°</output>
              <input
                aria-label="Aligned within"
                type="range"
                min="0"
                max="15"
                value={tolerance}
                onChange={(event) => setTolerance(Number(event.target.value))}
              />
            </label>
          </div>
          <p>
            Maximum move caps the hue shift before strength is applied. Colors within the alignment tolerance
            stay unchanged.
          </p>
        </details>
      </div>
      <details className={sharedStyles.details}>
        <summary>Compare all harmony fits</summary>
        {rankings.length ? (
          <ul className={styles.ranking}>
            {rankings.map((candidate) => (
              <li key={candidate.kind}>
                <button type="button" onClick={() => chooseHarmony(candidate.kind)}>
                  {templates[candidate.kind].name}
                </button>
                <span>{candidate.meanMovement.toFixed(1)}°</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>No reliable hues yet.</p>
        )}
        <p>
          Automatic ranking adds a small complexity penalty and penalizes unused axes. The displayed movement
          is the unpenalized fit. Nearby rankings can be equally useful.
        </p>
      </details>
    </section>
  );
}
