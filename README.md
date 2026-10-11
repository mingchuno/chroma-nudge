# Chroma Nudge

A browser-only photo harmony reference tool for photographers preparing a color grade. Sample a local photo, explore harmonies, and export reference colors for your photo editor. The original photo stays unchanged.

Built with React, TypeScript, Vite, and CSS Modules. No backend, accounts, analytics, or persistent photo storage.

## Open without a server

Double-click `dist/chroma-nudge.html`. It contains the app, styles, and fonts. Photos stay in browser memory; the standalone build blocks network connections through Content Security Policy. No account, upload, tracking, or local photo storage.

1. Open a JPEG, PNG, WebP, or AVIF, or explore the six-color demo.
2. Optionally click **Auto sample** for up to 4–6 dominant colors (five by default), or click regions of interest. Auto sampling keeps existing samples, skips similar colors, and offers Undo for its latest added batch. Drag dots, or focus them and use arrow keys (Shift moves 10 pixels). Name up to 16 samples.
3. Compare Natural, Pure hues, and Harmony guide. Choose a harmony or automatic fitting. Anchor one chromatic sample if its color should stay fixed.
4. Adjust strength, move cap, and alignment tolerance. Custom mode supports independent target dragging and numeric hue entry for the selected sample.
5. Export a PNG reference sheet, an editable SVG, or a JSON study. PNG sheets use 2× resolution for crisp text. Exports contain colors and coordinates, not the photo. Hex buttons copy colors when the browser permits clipboard access.

## Development

Node 24 LTS and pnpm are pinned in `mise.toml`. Versions are locked in `pnpm-lock.yaml`.

```sh
mise install
mise exec -- pnpm install --frozen-lockfile
mise exec -- pnpm dev
```

```sh
pnpm typecheck
pnpm check
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:browser
```

`pnpm build` creates both a normal static Vite build and the standalone HTML, then checks bundle embedding integrity. Browser tests exercise both direct `file://` opening and the generated Pages artifact through a temporary local preview server. The standalone app needs no server at runtime.

## Method and boundaries

The [fitting method](METHOD.md) documents the research basis, template definitions, weights, ranking heuristics, and known limits. The engine minimizes chroma-weighted circular HSL hue movement, protects near-neutrals, and preserves HSL saturation/lightness in its suggestions. Analogous uses a continuous arc. Automatic ranking favors simple, occupied templates. A displayed movement in degrees is neither aesthetic confidence nor an editor slider value.

Browser-decoded canvas samples are averaged over 5 × 5 analysis pixels. Photos above 2,400 pixels on their long edge are resized; transparent pixels are composited over white. Inputs over 40 MB or 60 megapixels are rejected. No RAW support or professional color-managed grading pipeline. HSL lightness preservation does not preserve perceptual brightness. The app supplies a reference and leaves actual editing to your photo editor.

Auto sampling clusters a bounded grid of patches in Oklab and places points on real matching patches. It favors large color areas, includes neutrals, merges near-duplicates, and may return fewer colors for simple photos. Small accents can be missed; add them manually. Extraction runs locally and only when requested.

Studies are transient. Clearing or closing discards them. JSON export is a reference format, not a session import format.

## Code boundaries

- `src/domain/color.ts`: sRGB/HSL conversion and hue arithmetic.
- `src/domain/harmony.ts`: deterministic fitting, ranking, and nudges.
- `src/domain/photo.ts`: image decoding and patch sampling.
- `src/domain/autoSample.ts`: deterministic dominant-color extraction; `perceptualColor.ts`: Oklab conversion and comparison.
- `src/domain/sampleAnalysis.ts`: shared target and nudge calculations.
- `src/domain/export.ts`: portable reference data; `referenceSheet.ts`: SVG formatting.
- `src/browser/`: PNG rendering and file downloads.
- `src/usePhotoStudy.ts`: workspace state and photo import lifecycle.
- `src/components/`: photo sampling, wheel, and reference presentation.
- `scripts/standalone.mjs`: packaging; `tests/`: browser behavior and privacy checks.

The [design principles](DESIGN.md) describe the workspace layout, visual hierarchy, and interaction priorities.

The build reads React and font licenses from the installed packages and embeds them in the standalone HTML. No separate notices document needs to be maintained.
