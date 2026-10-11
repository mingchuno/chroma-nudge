# Photo harmony research

Researched 2026-10-11. Primary-source document review; this is not an independent network/privacy audit of third-party tools.

## Free alternatives

| Tool | Image sampling | Harmony support | Recommendation and limits |
| --- | --- | --- | --- |
| [Adobe Color](https://color.adobe.com/create/image) | Extracts an image palette and lets users move image selectors to refine swatches. | Its [product page](https://www.adobe.com/products/color.html) documents rule-based harmony creation. | Closest established workflow for selecting photo colors and exploring harmonies. [Adobe's free-membership help](https://helpx.adobe.com/sg/creative-cloud/help/benefits-creative-cloud-membership.html) includes Adobe Color; library saving uses Adobe's account/cloud services. The reviewed sources do not establish automatic per-sample directional nudges or browser-only image processing. |
| [Paleta](https://usepaleta.com/image) | Pixel magnifier and click-to-grab spot picking, Add to palette, automatic palette extraction, and painted-region extraction. | Its separate [Harmonies tool](https://usepaleta.com/harmony) generates complementary, split-complementary, triadic, analogous, tetradic and square schemes from a base color. | Best free option when browser-local processing matters. [Paleta states](https://usepaleta.com/) that all tools are free, need no account and process photos locally. This is the provider's claim, not an independently verified privacy guarantee. Automatic multi-sample harmony fitting and per-sample nudges were not confirmed. |
| [Paletton](https://paletton.com/) | Photo upload/spot sampling was not documented in the reviewed application description. | Classical schemes, adjustable wheel, brightness/saturation, and several swatch export formats. Uses an artistic RYB wheel. | Good for manual harmony exploration after copying a sampled HEX value. Browser-accessible without a purchase gate, but does not reproduce the full photo workflow. Automatic photo-derived nudges and image privacy were not established. |

None of these sources establishes the complete sample → fit → per-sample adjustment workflow visible in the supplied screenshots. Adobe Color and Paleta cover substantial parts; Paletton is a useful manual companion.

## What can be reconstructed

The screenshots show draggable numbered photo samples, HEX and HSL readouts, a natural-saturation wheel, a pure-hue wheel, harmony target markers/arrows, color locks and manual harmony selection. [Louimagin's article](https://www.louimagin.com/how-to-color-grade-photos) confirms that Color Lab samples photo colors, identifies harmonies and suggests which colors to move. Neither the article nor screenshots disclose the proprietary objective, thresholds or score calibration. An identical algorithm cannot be inferred.

The screenshot's first sample is approximately `#777578`, H 280°, S 1%, L 46%. Its plotted violet hue is mathematically valid but visually unreliable: near-neutral hue can change substantially when a channel changes by only one or two code values. Protect such samples by default. [W3C CSS Color](https://www.w3.org/TR/css-color-4/#the-hsl-notation) describes HSL as an sRGB representation and hue becoming powerless for achromatic colors; HSL lightness is not perceptually uniform brightness.

## Research basis and chosen algorithm

[Tan, Echevarria and Gingold, section 4.1](https://arxiv.org/html/1804.01225v2#S4.SS1), fit hue-axis templates to a palette by assigning each color to its nearest axis and searching the global rotation. Their objective weights angular changes by image contribution, lightness and chroma, operates in perceptual LCh, treats an analogous arc as zero distance inside the arc, and permits strength interpolation. This supports the general fitting strategy; it does not validate our HSL parameters or ranking heuristics.

For this independent reference tool, use the following explicitly project-owned model:

1. Convert browser-sampled sRGB values to HSL. Use normalized RGB chroma `c = s × (1 − |2l − 1|)` as the fitting weight. Samples with `c < 0.025` are protected and excluded from fitting. Samples represent chosen interests equally before this chroma weighting; they do not estimate image area.
2. Measure shortest circular hue distance, including wraparound at 0°/360°. For each rotation, assign each eligible sample to its nearest target axis. Minimize the weighted mean absolute angular distance.
3. Templates: monochromatic `[0]`, complementary `[0, 180]`, split-complementary `[0, 150, 210]`, triadic `[0, 120, 240]`, square `[0, 90, 180, 270]`. Analogous uses a continuous arc within ±30° of its center; samples inside the arc remain unchanged.
4. Search rotations every 0.5°, then refine around the best candidate every 0.05°. With an anchor, test rotations that place an axis exactly at its hue; retain that sample's original value exactly. For analogous, center the arc on the anchor.
5. Rank suggested templates using fit error plus 2.5° per additional axis and 5° per unused axis; add 4° for analogous. These are transparent anti-overfitting heuristics invented for this application, not research-derived constants. Show angular fit rather than a probability of beauty or a calibrated confidence percentage.
6. Compute each shortest signed target rotation, cap its magnitude by the user's maximum nudge, then multiply by strength. Preserve the original HSL saturation and lightness. A 60° target distance with a 20° cap and 50% strength yields a 10° suggestion. Custom targets use the same cap/strength rules.

## Practical limits

Harmony is a geometric reference, not an aesthetic verdict. Chosen samples can miss important colors; duplicates can overrepresent one region. Near-neutral colors should not steer a fit. Preserving HSL S/L does not preserve perceived brightness or color difference, and these angles do not map directly to Lightroom/Camera Raw slider units. RYB, HSL and perceptual LCh wheels have different complements; Paletton results need not match this app.

The output is a reference palette and directional notes, not an edited photograph, RAW processor, mask or LUT. Use a normal sRGB export for comparison; browser decoding/profile conversion and image resampling can produce values different from a desktop editor. The custom app should keep image pixels and analysis in browser memory, bundle its assets, and avoid analytics, external fonts, uploads and server calls. Verify that property separately in the built application.
