import { ColorWheel, type WheelMode } from './components/ColorWheel';
import { PhotoSampler } from './components/PhotoSampler';
import { SampleReference } from './components/SampleReference';
import styles from './components/Workspace.module.css';
import { templates } from './domain/harmony';
import { type Selection, usePhotoStudy } from './usePhotoStudy';

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5" />
    </svg>
  );
}

export function App() {
  const {
    photo,
    setPhoto,
    samples,
    setSamples,
    selectedId,
    setSelectedId,
    anchorId,
    setAnchorId,
    selection,
    mode,
    setMode,
    strength,
    setStrength,
    maxShift,
    setMaxShift,
    tolerance,
    setTolerance,
    intention,
    message,
    setMessage,
    error,
    isLoading,
    setIsLoading,
    isDraggingFile,
    setIsDraggingFile,
    fileInput,
    importSequence,
    rankings,
    fit,
    isCustom,
    selected,
    chromaticCount,
    importPhoto,
    placeSample,
    updateSample,
    removeSample,
    loadDemo,
    copyHex,
    chooseHarmony,
  } = usePhotoStudy();

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <a href="#main" className={styles.brand}>
          <span className={styles.brandMark} aria-hidden="true" />
          Chroma Nudge
        </a>
        <a className={styles.helpLink} href="#explanation">
          How it works
        </a>
      </header>
      <main id="main">
        <div className={`${styles.intro} ${photo ? styles.introCompact : ''}`}>
          <h1>
            Find the harmony.
            <br />
            <em>Keep the feeling.</em>
          </h1>
          <div className={styles.introRight}>
            <p>
              A color study for your next edit. Sample what matters, explore a harmony, and take a gentle
              nudge back to your photo editor.
            </p>
          </div>
        </div>
        <input
          ref={fileInput}
          className={styles.hiddenInput}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          aria-label="Open a photo"
          onChange={(event) => {
            void importPhoto(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
        <div role="status" aria-live="polite" aria-atomic="true" className={styles.hiddenInput}>
          {isLoading ? 'Reading your photo locally…' : message}
        </div>
        {isLoading && <p className={styles.status}>Reading your photo locally…</p>}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {!photo ? (
          <section
            className={styles.empty}
            aria-label="Open a photo to begin"
            onDragOver={(event) => {
              event.preventDefault();
              setIsDraggingFile(true);
            }}
            onDragLeave={() => setIsDraggingFile(false)}
            onDrop={(event) => {
              event.preventDefault();
              setIsDraggingFile(false);
              void importPhoto(event.dataTransfer.files[0]);
            }}
            data-dragging={isDraggingFile}
          >
            <div className={styles.emptyArt} aria-hidden="true">
              <div />
              <div />
              <div />
              <div />
              <div />
            </div>
            <h2>Start with a photograph.</h2>
            <p>Drop it here, or choose a file. Your image stays in this browser.</p>
            <button
              type="button"
              className={styles.primary}
              disabled={isLoading}
              onClick={() => fileInput.current?.click()}
            >
              <UploadIcon />
              Open a photo
            </button>
            <small>JPEG, PNG, WebP, AVIF · up to 40 MB</small>
            <button type="button" className={styles.textButton} onClick={loadDemo}>
              Explore a six-color demo
            </button>
          </section>
        ) : (
          <>
            <div className={styles.toolbar}>
              <p className={styles.filename}>
                {photo.name}
                <small>
                  {photo.width} × {photo.height} analysis pixels
                </small>
              </p>
              <button
                className={styles.secondary}
                type="button"
                disabled={isLoading}
                onClick={() => fileInput.current?.click()}
              >
                Change photo
              </button>
              <button
                className={styles.textButton}
                type="button"
                onClick={() => {
                  ++importSequence.current;
                  setIsLoading(false);
                  setPhoto(undefined);
                  setSamples([]);
                  setSelectedId(undefined);
                  setAnchorId(undefined);
                  setMessage('Photo cleared from this workspace.');
                }}
              >
                Clear workspace
              </button>
            </div>
            <div className={styles.workspace}>
              <section className={styles.photoColumn} aria-labelledby="photo-title">
                <div className={styles.sectionTitle}>
                  <h2 id="photo-title">Your photo</h2>
                  <span>{samples.length} / 16 samples</span>
                </div>
                <PhotoSampler
                  photo={photo}
                  samples={samples}
                  selectedId={selectedId}
                  onPlace={placeSample}
                  onSelect={setSelectedId}
                />
                <p className={styles.caption}>Click to sample. Drag a dot to refine.</p>
                <div className={styles.sampleActions}>
                  <button
                    type="button"
                    className={styles.secondary}
                    disabled={samples.length >= 16}
                    onClick={() => placeSample({ x: 0.5, y: 0.5 })}
                  >
                    Add center sample
                  </button>
                  <button
                    type="button"
                    className={styles.textButton}
                    disabled={!samples.length}
                    onClick={() => {
                      setSamples([]);
                      setAnchorId(undefined);
                      setSelectedId(undefined);
                    }}
                  >
                    Clear samples
                  </button>
                </div>
                <details className={styles.details}>
                  <summary>Sampling help & keyboard controls</summary>
                  <p>Focus a dot and use arrow keys for precision; Shift moves 10 pixels.</p>
                  <p>
                    Choose subjects, foliage, sky, shadows, and highlights you actually want to grade. Five to
                    eight distinct regions usually give a useful study. This is a 5 × 5 pixel average at the
                    displayed analysis resolution; repeated samples act as extra weight. Transparent pixels
                    are composited over white.
                  </p>
                </details>
              </section>
              <section className={styles.wheelColumn} aria-labelledby="wheel-title">
                <div className={styles.sectionTitle}>
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
                    <button
                      key={value}
                      type="button"
                      aria-pressed={mode === value}
                      onClick={() => setMode(value)}
                    >
                      {value === 'natural' ? 'Natural' : value === 'pure' ? 'Pure hues' : 'Harmony guide'}
                    </button>
                  ))}
                </fieldset>
                <p className={styles.caption}>
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
                  <select
                    value={selection}
                    onChange={(event) => chooseHarmony(event.target.value as Selection)}
                  >
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
                  <details className={styles.details}>
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
                      Maximum move caps the hue shift before strength is applied. Colors within the alignment
                      tolerance stay unchanged.
                    </p>
                  </details>
                </div>
                <details className={styles.details}>
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
                    Automatic ranking adds a small complexity penalty and penalizes unused axes. The displayed
                    movement is the unpenalized fit. Nearby rankings can be equally useful.
                  </p>
                </details>
              </section>
              <SampleReference
                samples={samples}
                selectedId={selectedId}
                options={{
                  fit,
                  custom: isCustom,
                  anchorId,
                  strength,
                  maxShift,
                  tolerance,
                  intention,
                  photoName: photo.name,
                }}
                onSelect={setSelectedId}
                onAnchor={setAnchorId}
                onUpdate={updateSample}
                onRemove={removeSample}
                onCopy={copyHex}
                onMessage={setMessage}
              />
            </div>
          </>
        )}
        <section id="explanation" className={styles.explanation} aria-labelledby="explanation-title">
          <h2 id="explanation-title">A direction, not a prescription.</h2>
          <p>
            Harmony is a geometric starting point. Protect skin tones and meaningful colors, and let your
            intention lead. Suggested colors preserve HSL saturation and lightness; perceived brightness can
            still change. These hue degrees are reference directions, not slider values for Lightroom or
            another editor.
          </p>
          <details className={styles.details}>
            <summary>Algorithm & privacy</summary>
            <p>
              Six templates are rotated around the HSL wheel, minimizing circular hue distance weighted by RGB
              chroma. Analogous uses a continuous 60° sector. Colors with RGB chroma below 2.5% are protected
              because their hue is unstable. Automatic selection favors simpler, occupied templates. A single
              anchor fixes one hue exactly; analogous centers its arc on the anchor. Nudge strength
              interpolates the shortest circular path after the maximum move cap. Colors within tolerance stay
              unchanged.
            </p>
            <p>
              Your photo is decoded into a local canvas, resized to at most 2,400 pixels on its long edge, and
              kept only in memory. No upload, tracking, remote fonts, or saved photos. Closing or clearing the
              workspace discards the study. Exports contain the reference colors and sample coordinates, not
              the photo. This app studies browser-decoded sRGB colors; it does not edit RAW files or implement
              a color-managed grading pipeline.
            </p>
            <p>
              Method inspired by{' '}
              <a href="https://arxiv.org/html/1804.01225v2" target="_blank" rel="noreferrer">
                Tan, Echevarria & Gingold’s palette harmonization research
              </a>
              . This implementation uses HSL for a familiar wheel, rather than the paper’s perceptual LCh
              space.
            </p>
          </details>
        </section>
      </main>
      {message && !isLoading && (
        <div className={styles.notification}>
          <p>{message}</p>
          <button type="button" aria-label="Dismiss notification" onClick={() => setMessage('')}>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="m4 4 8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>
      )}
      <footer className={styles.footer}>
        <span>Chroma Nudge</span>
        <p>Made for thoughtful color. Everything happens in your browser.</p>
      </footer>
    </div>
  );
}
