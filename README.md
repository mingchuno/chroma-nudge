# Chroma Nudge

A local photo harmony reference tool, built with vanilla React, TypeScript 7, Vite, and CSS Modules. No framework or backend. The implementation reproduces the supplied Color Lab workflow with its own documented fitting method; it does not recover proprietary code.

## Open without a server

Double-click `dist/chroma-nudge.html`. It contains the app, styles, and fonts. Photos stay in browser memory; the standalone build blocks network connections through Content Security Policy. No account, upload, tracking, or local photo storage.

1. Open a JPEG, PNG, WebP, or AVIF, or explore the six-color demo.
2. Click regions of interest. Drag dots, or focus them and use arrow keys (Shift moves 10 pixels). Name up to 16 samples.
3. Compare Natural, Pure hues, and Harmony guide. Choose a harmony or automatic fitting. Anchor one chromatic sample if its color should stay fixed.
4. Adjust strength, move cap, and alignment tolerance. Custom mode supports independent target dragging and numeric hue entry for the selected sample.
5. Export an SVG reference sheet or a JSON study. Exports contain colors and coordinates, not the photo. Hex buttons copy colors when the browser permits clipboard access.

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

The [research report](RESEARCH.md) documents sources, alternatives, template definitions, weights, ranking heuristics, and known limits. The engine minimizes chroma-weighted circular HSL hue movement, protects near-neutrals, and preserves HSL saturation/lightness in its suggestions. Analogous uses a continuous arc. Automatic ranking favors simple, occupied templates. A displayed movement in degrees is neither aesthetic confidence nor an editor slider value.

Browser-decoded canvas samples are averaged over 5 × 5 analysis pixels. Photos above 2,400 pixels on their long edge are resized; transparent pixels are composited over white. Inputs over 40 MB or 60 megapixels are rejected. No RAW support or professional color-managed grading pipeline. HSL lightness preservation does not preserve perceptual brightness. The app supplies a reference and leaves actual editing to your photo editor.

Studies are transient. Clearing or closing discards them. JSON export is a reference format, not a session import format.

## Code boundaries

- `src/domain/color.ts`: sRGB/HSL conversion and hue arithmetic.
- `src/domain/harmony.ts`: deterministic fitting, ranking, and nudges.
- `src/domain/photo.ts`: image decoding and patch sampling.
- `src/domain/export.ts`: portable references and safe SVG generation.
- `src/usePhotoStudy.ts`: workspace state and photo import lifecycle.
- `src/components/`: photo sampling, wheel, and reference presentation.
- `scripts/standalone.mjs`: packaging; `tests/`: browser behavior and privacy checks.

The build reads React and font licenses from the installed packages and embeds them in the standalone HTML. No separate notices document needs to be maintained.

## GitHub Pages

Target repository: `mingchuno/chroma-nudge`. Custom domain: `color.mcor.dev`.

The Pages workflow validates pull requests, and deploys successful `main` pushes or manual runs on `main`. It enforces Node 24 and installs the pnpm version from `package.json` using the frozen lockfile. Type checks, recommended Biome rules, domain tests, build integrity, and Chromium tests must pass before deployment. Browser tests cover both the downloadable HTML and a hosted project-path URL.

The generated `pages/index.html` is the self-contained app with its network-blocking Content Security Policy. It works at the project path and the custom-domain root without a separate asset base. `pages/` and `dist/` are generated and ignored.

Before the first deployment:

1. In the repository Settings → Pages, select **GitHub Actions** as the build source.
2. Set the custom domain to **color.mcor.dev** in Pages settings. Actions deployments use that setting; a committed CNAME file is not required.
3. In DNS, add a CNAME for `color` pointing to **mingchuno.github.io** (no repository path). Verify domain ownership through GitHub's domain verification flow, then enable **Enforce HTTPS** after GitHub provisions the certificate.
4. Push these changes to `main`, or manually run **Check and deploy Pages** on `main`.

The workflow is prepared locally; configuring repository settings, DNS, and a live deployment must be verified separately. No custom DNS record is changed by the workflow. See [GitHub custom-domain guidance](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site).
