# Chroma Nudge

A browser-only photo harmony reference tool for photographers preparing a color grade. Sample a local photo, explore harmonies, and export reference colors for your photo editor. The original photo stays unchanged.

Built with React, TypeScript, Vite, and CSS Modules. No backend, accounts, analytics, or persistent photo storage.

## Open without a server

Double-click `dist/chroma-nudge.html`. It contains the app, styles, and fonts. Photos stay in browser memory; the standalone build blocks network connections through Content Security Policy. No account, upload, tracking, or local photo storage.

1. Open a JPEG, PNG, WebP, or AVIF, or explore the six-color demo.
2. Click regions of interest. Drag dots, or focus them and use arrow keys (Shift moves 10 pixels). Name up to 16 samples.
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

Studies are transient. Clearing or closing discards them. JSON export is a reference format, not a session import format.

## Code boundaries

- `src/domain/color.ts`: sRGB/HSL conversion and hue arithmetic.
- `src/domain/harmony.ts`: deterministic fitting, ranking, and nudges.
- `src/domain/photo.ts`: image decoding and patch sampling.
- `src/domain/sampleAnalysis.ts`: shared target and nudge calculations.
- `src/domain/export.ts`: portable reference data; `referenceSheet.ts`: SVG formatting.
- `src/browser/`: PNG rendering and file downloads.
- `src/usePhotoStudy.ts`: workspace state and photo import lifecycle.
- `src/components/`: photo sampling, wheel, and reference presentation.
- `scripts/standalone.mjs`: packaging; `tests/`: browser behavior and privacy checks.

The [design principles](DESIGN.md) describe the workspace layout, visual hierarchy, and interaction priorities.

The build reads React and font licenses from the installed packages and embeds them in the standalone HTML. No separate notices document needs to be maintained.

## GitHub Pages

Target repository: `mingchuno/chroma-nudge`. Custom domain: `color.mcor.dev`.

The Pages workflow validates pull requests, and deploys successful `main` pushes or manual runs on `main`. It enforces Node 24 and installs the pnpm version from `package.json` using the frozen lockfile. Type checks, recommended Biome rules, domain tests, build integrity, and Chromium tests must pass before deployment. Browser tests cover both the downloadable HTML and a hosted project-path URL.

The generated `pages/index.html` embeds the app, styles, and fonts. Its Content Security Policy permits same-origin installation assets while still blocking app network connections. The manifest and icons use relative paths so installation works at both the project path and custom-domain root. `pages/` and `dist/` are generated and ignored.

Repository and domain configuration:

1. In the repository Settings → Pages, select **GitHub Actions** as the build source.
2. Set the custom domain to **color.mcor.dev** in Pages settings. Actions deployments use that setting; a committed CNAME file is not required.
3. In DNS, add a CNAME for `color` pointing to **mingchuno.github.io** (no repository path). Verify domain ownership through GitHub's domain verification flow, then enable **Enforce HTTPS** after GitHub provisions the certificate.
4. Deploy by pushing to `main` or manually running **Check and deploy Pages** on `main`.

Repository Pages settings and DNS are managed separately from the workflow. The workflow does not change DNS records. See [GitHub custom-domain guidance](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).

## Mobile installation

Open the hosted HTTPS site. On iPhone or iPad, use Safari’s Share menu → Add to Home Screen and enable Open as Web App if shown. On Android, use the browser menu → Install app or Add to Home screen. The app opens in a standalone window with the Chroma Nudge icon. Installation requires the hosted site; the downloadable HTML remains a self-contained local file.

`public/` contains the SVG favicon source, ICO/PNG fallbacks, 180px Apple touch icon, 192px and 512px app icons, a maskable icon, and `manifest.webmanifest`. The maskable variant keeps the color ring inside the central safe area. The build copies these assets into both `dist/` and `pages/`. No service worker or offline cache is added; hosted use needs a connection to reopen the app. Installing does not save photos or studies.
