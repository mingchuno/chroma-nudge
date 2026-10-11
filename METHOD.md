# Harmony fitting method

Chroma Nudge fits user-selected colors to HSL harmony templates and suggests bounded hue adjustments. This is an independent implementation; the model and ranking constants below define its behavior.

## Research basis

[Tan, Echevarria and Gingold, section 4.1](https://arxiv.org/html/1804.01225v2#S4.SS1), fit hue-axis templates to a palette by assigning each color to its nearest axis and searching the global rotation. Their objective weights angular changes by image contribution, lightness and chroma, operates in perceptual LCh, treats an analogous arc as zero distance inside the arc, and permits strength interpolation. This supports the general fitting strategy; it does not validate our HSL parameters or ranking heuristics.

## Fitting and suggestions

The application uses this project-owned model:

1. Convert browser-sampled sRGB values to HSL. Use normalized RGB chroma `c = s × (1 − |2l − 1|)` as the fitting weight. Samples with `c < 0.025` are protected and excluded from fitting. Samples represent chosen interests equally before this chroma weighting; they do not estimate image area.
2. Measure shortest circular hue distance, including wraparound at 0°/360°. For each rotation, assign each eligible sample to its nearest target axis. Minimize the weighted mean absolute angular distance.
3. Templates: monochromatic `[0]`, complementary `[0, 180]`, split-complementary `[0, 150, 210]`, triadic `[0, 120, 240]`, square `[0, 90, 180, 270]`. Analogous uses a continuous arc within ±30° of its center; samples inside the arc remain unchanged.
4. Search rotations every 0.5°, then refine around the best candidate every 0.05°. With an anchor, test rotations that place an axis exactly at its hue; retain that sample's original value exactly. For analogous, center the arc on the anchor.
5. Rank suggested templates using fit error plus 2.5° per additional axis and 5° per unused axis; add 4° for analogous. These are transparent anti-overfitting heuristics invented for this application, not research-derived constants. Show angular fit rather than a probability of beauty or a calibrated confidence percentage.
6. Keep anchored samples and samples within the alignment tolerance unchanged. For other samples, compute the shortest signed target rotation, cap its magnitude by the user's maximum nudge, then multiply by strength. Preserve the original HSL saturation and lightness. A 60° target distance with a 20° cap and 50% strength yields a 10° suggestion. Custom targets use the same cap/strength rules.

## Practical limits

Harmony is a geometric reference, not an aesthetic verdict. Chosen samples can miss important colors; duplicates can overrepresent one region. Near-neutral colors should not steer a fit. Preserving HSL S/L does not preserve perceived brightness or color difference, and these angles do not map directly to Lightroom/Camera Raw slider units. RYB, HSL and perceptual LCh wheels have different complements; Paletton results need not match this app.

The output is a reference palette and directional notes, not an edited photograph, RAW processor, mask or LUT. Use a normal sRGB export for comparison; browser decoding/profile conversion and image resampling can produce values different from a desktop editor.

## Sampling

[Photo sampling](src/domain/photo.ts) uses browser-decoded sRGB canvas pixels, averages a 5 × 5 patch clipped at image edges, and composites transparency over white. The analysis image is resized to at most 2,400 pixels on its long edge. Each chosen sample contributes independently; sampling the same region repeatedly increases its influence.

## Optional automatic sampling

[Auto sampling](src/domain/autoSample.ts) selects up to four, five or six patches only when requested. It uses the existing decoded photo and the same 5 × 5 patch average as manual sampling; no network or trained model is involved.

1. Collect an area-uniform grid of at most 16,000 patch candidates, retaining normalized coordinates. Convert their sRGB values through linear RGB to Cartesian Oklab using [Ottosson's conversion](https://bottosson.github.io/posts/oklab/).
2. Initialize centres deterministically from 5-bit-per-channel RGB histogram bins. Choose the most populated bin first, then maximize population × squared distance to the nearest existing centre. Run k-means for at most 20 iterations, stopping when every centre's squared movement is below `1e-8`; discard empty clusters. Histogram bins seed the process; clustering uses unquantized patch colours.
3. Repeatedly merge the closest pair of centres within Oklab distance `0.045`, recomputing the merged mean. Sort by candidate population. Discard clusters below 2% of sampled area, always retaining the largest cluster.
4. For each cluster choose the actual member patch nearest its centre. Colour-distance ties prefer a member near the cluster's mean image position. Return that patch's coordinates and HSL colour, so dragging continues to use the same sampling rule.
5. Skip extracted colours within Oklab distance `0.045` of existing samples, append within the 16-sample limit, and preserve existing names, positions and anchors. Undo removes only the latest added batch, including edits to that batch; subsequent manual samples remain.

Merge and coverage thresholds are project heuristics, not calibrated perceptual or aesthetic confidence. Dominance represents area, not subject importance. Small accents, periodic textures and gradients can be missed or split. Transparent areas already appear as white because decoding composites them. Neutrals remain eligible for extraction but retain the harmony engine's existing protection. Extracted coverage does not change harmony weights: each retained sample remains one chosen interest.

Fixture tests cover distinct colours, neutrals, low-colour images, lightness variation, narrow images, representative patch correspondence and repeatability. Browser tests cover optional invocation, count choices, preservation, duplicate skipping, undo and capacity in both builds. A generated 2,400 × 1,600 image measured approximately 23 ms for the synchronous click handler on the development machine and 64 ms with Chromium CPU throttled 4×. This single synthetic check does not establish performance on physical phones or palette quality across real photographs.

## Implementation

- [Color conversion](src/domain/color.ts): HSL conversion, chroma, and circular hue arithmetic.
- [Harmony engine](src/domain/harmony.ts): template fitting, ranking, and bounded suggestions.
- [Sample analysis](src/domain/sampleAnalysis.ts): shared calculations for display and export.
- [Regression tests](src/domain/harmony.test.ts): template rotation, anchors, near-neutrals, analogous arcs, and cap/strength behavior.
