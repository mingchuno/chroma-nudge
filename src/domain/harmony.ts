import { chroma, type Hsl, hasMeaningfulHue, signedHueDelta, wrapHue } from './color';

export const templates = {
  monochromatic: {
    name: 'Monochromatic',
    offsets: [0],
    description: 'One hue, with your existing shades and light.',
  },
  analogous: {
    name: 'Analogous',
    offsets: [-30, 30],
    description: 'A continuous 60° arc of neighboring hues.',
  },
  complementary: {
    name: 'Complementary',
    offsets: [0, 180],
    description: 'Two opposing hues for a clear color contrast.',
  },
  'split-complementary': {
    name: 'Split-complementary',
    offsets: [0, 150, 210],
    description: 'One hue and two neighbors of its opposite.',
  },
  triadic: {
    name: 'Triadic',
    offsets: [0, 120, 240],
    description: 'Three hues, equally spaced around the wheel.',
  },
  square: {
    name: 'Square',
    offsets: [0, 90, 180, 270],
    description: 'Four hues arranged as two complementary pairs.',
  },
} as const;
export type HarmonyKind = keyof typeof templates;
export interface HarmonyFit {
  kind: HarmonyKind;
  rotation: number;
  targets: number[];
  meanMovement: number;
  rankCost: number;
}

export function nearestTemplateHue(hue: number, kind: HarmonyKind, rotation: number): number {
  if (kind === 'analogous') {
    const delta = signedHueDelta(rotation, hue);
    return wrapHue(rotation + Math.max(-30, Math.min(30, delta)));
  }
  const axes = templates[kind].offsets.map((offset) => wrapHue(rotation + offset));
  return axes.reduce((nearest, axis) =>
    Math.abs(signedHueDelta(hue, axis)) < Math.abs(signedHueDelta(hue, nearest)) ? axis : nearest,
  );
}

function evaluateRotation(colors: Hsl[], kind: HarmonyKind, rotation: number): HarmonyFit {
  const targets = colors.map((color) => nearestTemplateHue(color.h, kind, rotation));
  let movement = 0;
  let weight = 0;
  const occupied = new Set<number>();
  colors.forEach((color, index) => {
    if (!hasMeaningfulHue(color)) return;
    const target = targets[index] ?? color.h;
    const importance = chroma(color);
    movement += importance * Math.abs(signedHueDelta(color.h, target));
    weight += importance;
    occupied.add(Math.round(target * 100));
  });
  const meanMovement = weight ? movement / weight : 0;
  // These explicit UX penalties favor economy, not aesthetic certainty.
  const axisCount = templates[kind].offsets.length;
  const complexity = kind === 'analogous' ? 4 : (axisCount - 1) * 2.5;
  const unused = kind === 'analogous' ? 0 : Math.max(0, axisCount - occupied.size) * 5;
  return {
    kind,
    rotation: wrapHue(rotation),
    targets,
    meanMovement,
    rankCost: meanMovement + complexity + unused,
  };
}

export function fitHarmony(colors: Hsl[], kind: HarmonyKind, anchorIndex?: number): HarmonyFit {
  const anchor = anchorIndex === undefined ? undefined : colors[anchorIndex];
  const hasUsableAnchor = anchor !== undefined && hasMeaningfulHue(anchor);
  const rotations = hasUsableAnchor
    ? kind === 'analogous'
      ? [anchor.h]
      : templates[kind].offsets.map((offset) => wrapHue(anchor.h - offset))
    : Array.from({ length: 720 }, (_, index) => index / 2);
  let best = evaluateRotation(colors, kind, rotations[0] ?? 0);
  for (const rotation of rotations) {
    const fit = evaluateRotation(colors, kind, rotation);
    if (fit.meanMovement < best.meanMovement - 1e-9) best = fit;
  }
  if (!hasUsableAnchor) {
    const coarseRotation = best.rotation;
    for (let step = -10; step <= 10; step++) {
      const fit = evaluateRotation(colors, kind, coarseRotation + step * 0.05);
      if (fit.meanMovement < best.meanMovement - 1e-9) best = fit;
    }
  }
  return best;
}

export function rankHarmonies(colors: Hsl[], anchorIndex?: number): HarmonyFit[] {
  if (!colors.some(hasMeaningfulHue)) return [];
  return (Object.keys(templates) as HarmonyKind[])
    .map((kind) => fitHarmony(colors, kind, anchorIndex))
    .sort((a, b) => a.rankCost - b.rankCost);
}

export interface NudgeOptions {
  targetHue: number;
  strength: number;
  maxShift: number;
  tolerance: number;
  isLocked?: boolean;
}
export function suggestNudge(original: Hsl, options: NudgeOptions) {
  const fullDelta = signedHueDelta(original.h, options.targetHue);
  const isProtected = !hasMeaningfulHue(original) || options.isLocked;
  const isAligned = Math.abs(fullDelta) <= options.tolerance;
  const delta =
    isProtected || isAligned
      ? 0
      : Math.sign(fullDelta) * Math.min(Math.abs(fullDelta), options.maxShift) * options.strength;
  return {
    color: { ...original, h: wrapHue(original.h + delta) },
    delta,
    fullDelta,
    isProtected,
    isAligned,
    isLimited: Math.abs(fullDelta) > options.maxShift && !isProtected && !isAligned,
  };
}
