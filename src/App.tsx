import { useRef, useState } from 'react';
import styles from './App.module.css';
import { copyHex } from './browser/clipboard';
import { HarmonyPanel } from './components/HarmonyPanel';
import { PhotoSampler } from './components/PhotoSampler';
import { SampleReference } from './components/SampleReference';
import sharedStyles from './components/Shared.module.css';
import { MAX_SAMPLES } from './domain/samplingPolicy';
import { usePhotoStudy } from './usePhotoStudy';

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 16V3m-5 5 5-5 5 5M4 15v5h16v-5" />
    </svg>
  );
}

export function App() {
  const study = usePhotoStudy();
  const fileInput = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  async function copySampleHex(hex: string) {
    setMessage(await copyHex(hex));
  }
  const {
    photo,
    samples,
    selectedId,
    setSelectedId,
    anchorId,
    setAnchorId,
    strength,
    maxShift,
    tolerance,
    intention,
    message,
    setMessage,
    error,
    isLoading,
    autoSampleCount,
    setAutoSampleCount,
    canUndoAutoSample,
    autoSample,
    undoAutoSample,
    fit,
    isCustom,
    importPhoto,
    placeSample,
    updateSample,
    removeSample,
    clearSamples,
    clearWorkspace,
    loadDemo,
  } = study;

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
              className={sharedStyles.primary}
              disabled={isLoading}
              onClick={() => fileInput.current?.click()}
            >
              <UploadIcon />
              Open a photo
            </button>
            <small>JPEG, PNG, WebP, AVIF · up to 40 MB</small>
            <button type="button" className={sharedStyles.textButton} onClick={loadDemo}>
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
                className={sharedStyles.secondary}
                type="button"
                disabled={isLoading}
                onClick={() => fileInput.current?.click()}
              >
                Change photo
              </button>
              <button className={sharedStyles.textButton} type="button" onClick={clearWorkspace}>
                Clear workspace
              </button>
            </div>
            <div className={styles.workspace}>
              <section aria-labelledby="photo-title">
                <div className={sharedStyles.sectionTitle}>
                  <h2 id="photo-title">Your photo</h2>
                  <span>
                    {samples.length} / {MAX_SAMPLES} samples
                  </span>
                </div>
                <PhotoSampler
                  photo={photo}
                  samples={samples}
                  selectedId={selectedId}
                  onPlace={placeSample}
                  onSelect={setSelectedId}
                />
                <p className={sharedStyles.caption}>Click to sample. Drag a dot to refine.</p>
                <div className={styles.autoSampleActions}>
                  <button
                    type="button"
                    className={sharedStyles.secondary}
                    disabled={isLoading || samples.length >= MAX_SAMPLES}
                    onClick={autoSample}
                  >
                    Auto sample
                  </button>
                  <label className={styles.autoSampleCount}>
                    Colors
                    <select
                      value={autoSampleCount}
                      disabled={isLoading}
                      onChange={(event) => {
                        const count = Number(event.target.value);
                        if (count === 4 || count === 5 || count === 6) setAutoSampleCount(count);
                      }}
                    >
                      <option value={4}>4</option>
                      <option value={5}>5</option>
                      <option value={6}>6</option>
                    </select>
                  </label>
                  {canUndoAutoSample && (
                    <button type="button" className={sharedStyles.textButton} onClick={undoAutoSample}>
                      Undo auto sample
                    </button>
                  )}
                </div>
                <p className={`${sharedStyles.caption} ${styles.autoSampleHelp}`}>
                  Adds dominant colors, keeps your samples. Simple photos may yield fewer colors.
                </p>
                <div className={styles.sampleActions}>
                  <button
                    type="button"
                    className={sharedStyles.textButton}
                    disabled={!samples.length}
                    onClick={clearSamples}
                  >
                    Clear samples
                  </button>
                </div>
                <details className={sharedStyles.details}>
                  <summary>Sampling help & keyboard controls</summary>
                  <p>
                    Focus the photo and press Enter or Space to add a sample. Focus a dot and use arrow keys
                    for precision; Shift moves 10 pixels.
                  </p>
                  <p>
                    Auto sample finds large color areas, including neutrals. Small accents may be missed;
                    click them to add a sample. Colors already represented are skipped.
                  </p>
                  <p>
                    Choose subjects, foliage, sky, shadows, and highlights you actually want to grade. Five to
                    eight distinct regions usually give a useful study. This is a 5 × 5 pixel average at the
                    displayed analysis resolution; repeated samples act as extra weight. Transparent pixels
                    are composited over white.
                  </p>
                </details>
              </section>
              <HarmonyPanel
                view={study}
                actions={{
                  selectSample: setSelectedId,
                  updateSample,
                  changeMode: study.setMode,
                  chooseHarmony: study.chooseHarmony,
                  changeStrength: study.setStrength,
                  changeMaxShift: study.setMaxShift,
                  changeTolerance: study.setTolerance,
                }}
              />
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
                onCopy={copySampleHex}
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
          <details className={`${sharedStyles.details} ${styles.explanationDetails}`}>
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
