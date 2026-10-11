import { describe, expect, it } from 'vitest';
import type { Sample } from './photo';
import { MAX_SAMPLES } from './samplingPolicy';
import { emptyStudy, studyReducer } from './studyState';

const sample = (id: number): Sample => ({ id, x: 0.5, y: 0.5, name: '', color: { h: 30, s: 0.8, l: 0.5 } });

describe('study transitions', () => {
  it('removes selection and anchor with their sample', () => {
    let state = studyReducer(emptyStudy, { type: 'place', sample: sample(1) });
    state = studyReducer(state, { type: 'anchor', id: 1 });
    state = studyReducer(state, { type: 'remove', id: 1 });
    expect(state.samples).toEqual([]);
    expect(state.selectedId).toBeUndefined();
    expect(state.anchorId).toBeUndefined();
  });
  it('releases an anchor moved to a neutral patch and preserves its name and target', () => {
    let state = studyReducer(emptyStudy, {
      type: 'place',
      sample: { ...sample(1), name: 'Sky', customHue: 90 },
    });
    state = studyReducer(state, { type: 'anchor', id: 1 });
    state = studyReducer(state, { type: 'place', sample: { ...sample(1), color: { h: 0, s: 0, l: 0.5 } } });
    expect(state.anchorId).toBeUndefined();
    expect(state.samples[0]).toMatchObject({ name: 'Sky', customHue: 90 });
  });
  it('undoes edited auto samples while keeping later manual samples and restoring selection', () => {
    let state = studyReducer(emptyStudy, { type: 'place', sample: sample(1) });
    state = studyReducer(state, { type: 'autoSample', samples: [sample(2), sample(3)] });
    state = studyReducer(state, { type: 'update', id: 2, updates: { name: 'Edited' } });
    state = studyReducer(state, { type: 'place', sample: sample(4) });
    state = studyReducer(state, { type: 'select', id: 2 });
    state = studyReducer(state, { type: 'anchor', id: 3 });
    state = studyReducer(state, { type: 'undoAutoSample' });
    expect(state.samples.map((sample) => sample.id)).toEqual([1, 4]);
    expect(state.selectedId).toBe(1);
    expect(state.anchorId).toBeUndefined();
    expect(state.autoSampleUndo).toBeUndefined();
  });
  it('does not restore a deleted selection when undoing', () => {
    let state = studyReducer(emptyStudy, { type: 'place', sample: sample(1) });
    state = studyReducer(state, { type: 'autoSample', samples: [sample(2)] });
    state = studyReducer(state, { type: 'remove', id: 1 });
    expect(studyReducer(state, { type: 'undoAutoSample' }).selectedId).toBeUndefined();
  });
  it('clears sample history and keeps fitting inputs stable for metadata edits', () => {
    const state = studyReducer(emptyStudy, { type: 'autoSample', samples: [sample(1)] });
    const renamed = studyReducer(state, { type: 'update', id: 1, updates: { name: 'Sky' } });
    const custom = studyReducer(renamed, { type: 'customTargets', targets: [60] });
    expect(renamed.colors).toBe(state.colors);
    expect(custom.colors).toBe(state.colors);
    expect(custom.samples[0]?.customHue).toBe(60);
    expect(studyReducer(custom, { type: 'clear' })).toEqual(emptyStudy);
  });
  it('enforces capacity and clears history when replacing with the demo', () => {
    const full = studyReducer(emptyStudy, {
      type: 'autoSample',
      samples: Array.from({ length: MAX_SAMPLES + 1 }, (_, i) => sample(i + 1)),
    });
    expect(full.samples).toHaveLength(MAX_SAMPLES);
    expect(studyReducer(full, { type: 'place', sample: sample(100) })).toBe(full);
    const demo = studyReducer(full, { type: 'demo', samples: [sample(30)] });
    expect(demo.selectedId).toBe(30);
    expect(demo.autoSampleUndo).toBeUndefined();
  });
});
