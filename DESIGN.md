# Design

A light editorial workspace keeps attention on the photograph and sampled colors. Warm paper, deep green ink, muted olive, and restrained earth accents provide a quiet backdrop. Self-hosted Newsreader headings and DM Sans controls. The color wheel and photograph carry the saturated color.

Three parallel regions: photo sampling, wheel and harmony controls, reference colors. At tablet widths the reference spans both columns; mobile stacks the task in the same order. Open a photo or an explicitly labeled geometric six-color demo. Neutral backgrounds make sampled colors comparable; row separators and one selected-row tint maintain scanability.

Precise coordinates use tabular numerals, hex codes use monospace. Controls have keyboard focus, labeled inputs, disabled and error states. No decorative animation: sample dragging and live fitting provide the interaction. The primary action is a photo upload initially and a reference export once samples exist.

Preserve these priorities when extending the interface: keep sampling, harmony selection, and reference comparison visible together on wide screens; retain that task order on small screens; use labels and numeric values alongside color so hue alone never carries meaning. Theme colors and responsive breakpoints live in the stylesheets; update those rather than maintaining a second token list here.
