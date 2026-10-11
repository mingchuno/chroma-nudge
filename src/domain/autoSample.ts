import { rgbToHsl } from './color';
import { colorDistanceSquared, type Oklab, rgbToOklab } from './perceptualColor';
import { type Photo, type Sample, samplePhotoRgb } from './photo';

export type AutoSampleCount = 4 | 5 | 6;
type PhotoSample = Pick<Sample, 'x' | 'y' | 'color'>;
interface Candidate extends PhotoSample {
  lab: Oklab;
  bin: number;
}
interface Cluster {
  center: Oklab;
  members: Candidate[];
}

const MAX_CANDIDATES = 16_000;
const MAX_ITERATIONS = 20;
const MERGE_DISTANCE_SQUARED = 0.045 ** 2;
const MIN_COVERAGE = 0.02;

function collectCandidates(photo: Photo): Candidate[] {
  const scale = Math.min(1, Math.sqrt(MAX_CANDIDATES / (photo.width * photo.height)));
  const columns = Math.max(1, Math.floor(photo.width * scale));
  const rows = Math.max(1, Math.min(Math.floor(photo.height * scale), Math.floor(MAX_CANDIDATES / columns)));
  const candidates: Candidate[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const px = Math.min(photo.width - 1, Math.floor(((column + 0.5) * photo.width) / columns));
      const py = Math.min(photo.height - 1, Math.floor(((row + 0.5) * photo.height) / rows));
      const position = {
        x: photo.width === 1 ? 0 : px / (photo.width - 1),
        y: photo.height === 1 ? 0 : py / (photo.height - 1),
      };
      const rgb = samplePhotoRgb(photo, position);
      candidates.push({
        ...position,
        color: rgbToHsl(rgb),
        lab: rgbToOklab(rgb),
        bin: (Math.floor(rgb.r / 8) << 10) | (Math.floor(rgb.g / 8) << 5) | Math.floor(rgb.b / 8),
      });
    }
  }
  return candidates;
}

function nearestCenter(color: Oklab, centers: Oklab[]): number {
  let nearest = 0;
  let distance = Infinity;
  centers.forEach((center, index) => {
    const current = colorDistanceSquared(color, center);
    if (current < distance) {
      nearest = index;
      distance = current;
    }
  });
  return nearest;
}

function initialCenters(candidates: Candidate[], count: number): Oklab[] {
  const bins = new Map<number, { color: Oklab; population: number }>();
  for (const candidate of candidates) {
    const existing = bins.get(candidate.bin);
    if (existing) existing.population++;
    else bins.set(candidate.bin, { color: candidate.lab, population: 1 });
  }
  const centers: Oklab[] = [];
  while (centers.length < count) {
    let best: Oklab | undefined;
    let bestScore = 0;
    for (const bin of bins.values()) {
      const distance = centers.length
        ? colorDistanceSquared(bin.color, centers[nearestCenter(bin.color, centers)] as Oklab)
        : 1;
      // Population-aware seeds avoid giving isolated noise the same priority as large regions.
      const score = bin.population * distance;
      if (score > bestScore) {
        best = bin.color;
        bestScore = score;
      }
    }
    if (!best || bestScore < 1e-10) break;
    centers.push(best);
  }
  return centers;
}

function meanColor(members: Candidate[]): Oklab {
  const total = { l: 0, a: 0, b: 0 };
  for (const member of members) {
    total.l += member.lab.l;
    total.a += member.lab.a;
    total.b += member.lab.b;
  }
  return { l: total.l / members.length, a: total.a / members.length, b: total.b / members.length };
}

function assignClusters(candidates: Candidate[], centers: Oklab[]): Cluster[] {
  const clusters = centers.map((center) => ({ center, members: [] as Candidate[] }));
  for (const candidate of candidates)
    clusters[nearestCenter(candidate.lab, centers)]?.members.push(candidate);
  return clusters.filter((cluster) => cluster.members.length > 0);
}

function fitClusters(candidates: Candidate[], count: number): Cluster[] {
  let centers = initialCenters(candidates, count);
  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const next = assignClusters(candidates, centers).map((cluster) => meanColor(cluster.members));
    const converged =
      next.length === centers.length &&
      next.every((center, index) => colorDistanceSquared(center, centers[index] as Oklab) < 1e-8);
    centers = next;
    if (converged) break;
  }
  return assignClusters(candidates, centers);
}

function mergeSimilarClusters(clusters: Cluster[]): Cluster[] {
  const merged = [...clusters];
  while (merged.length > 1) {
    let pair: [number, number] | undefined;
    let closest = MERGE_DISTANCE_SQUARED;
    for (let left = 0; left < merged.length; left++) {
      for (let right = left + 1; right < merged.length; right++) {
        const distance = colorDistanceSquared(
          (merged[left] as Cluster).center,
          (merged[right] as Cluster).center,
        );
        if (distance < closest) {
          closest = distance;
          pair = [left, right];
        }
      }
    }
    if (!pair) break;
    const left = merged[pair[0]] as Cluster;
    const right = merged[pair[1]] as Cluster;
    const members = [...left.members, ...right.members];
    merged[pair[0]] = { center: meanColor(members), members };
    merged.splice(pair[1], 1);
  }
  return merged;
}

function representativeSample(cluster: Cluster): PhotoSample {
  let best = cluster.members[0] as Candidate;
  let bestDistance = Infinity;
  const position = cluster.members.reduce((sum, member) => ({ x: sum.x + member.x, y: sum.y + member.y }), {
    x: 0,
    y: 0,
  });
  position.x /= cluster.members.length;
  position.y /= cluster.members.length;
  let bestPositionDistance = Infinity;
  for (const member of cluster.members) {
    const distance = colorDistanceSquared(member.lab, cluster.center);
    const positionDistance = (member.x - position.x) ** 2 + (member.y - position.y) ** 2;
    if (
      distance < bestDistance - 1e-12 ||
      (Math.abs(distance - bestDistance) <= 1e-12 && positionDistance < bestPositionDistance)
    ) {
      best = member;
      bestDistance = distance;
      bestPositionDistance = positionDistance;
    }
  }
  return { x: best.x, y: best.y, color: best.color };
}

export function extractPhotoSamples(photo: Photo, count: AutoSampleCount): PhotoSample[] {
  const candidates = collectCandidates(photo);
  const clusters = mergeSimilarClusters(fitClusters(candidates, count));
  return clusters
    .sort((left, right) => right.members.length - left.members.length)
    .filter((cluster, index) => index === 0 || cluster.members.length / candidates.length >= MIN_COVERAGE)
    .map(representativeSample);
}
