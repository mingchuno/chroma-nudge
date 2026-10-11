import { type SetStateAction, useMemo, useRef, useState } from 'react';
import { type AutoSampleCount, extractPhotoSamples } from './domain/autoSample';
import { type Hsl, hasMeaningfulHue } from './domain/color';
import { fitHarmony, type HarmonyKind, rankHarmonies } from './domain/harmony';
import { areSimilarColors } from './domain/perceptualColor';
import { createDemo, decodePhoto, type Photo, type Sample, samplePhoto } from './domain/photo';
export type WheelMode = 'natural' | 'pure' | 'guide';
export type Selection = 'auto' | 'custom' | HarmonyKind;
export function usePhotoStudy() {
  const [photo, setPhoto] = useState<Photo>();
  const [{ samples, colors }, setSampleCollection] = useState<{ samples: Sample[]; colors: Hsl[] }>({
    samples: [],
    colors: [],
  });
  // Keep fitting inputs stable when only names or custom targets change.
  function setSamples(update: SetStateAction<Sample[]>) {
    setSampleCollection((previous) => {
      const samples = typeof update === 'function' ? update(previous.samples) : update;
      const sameColors =
        samples.length === previous.colors.length &&
        samples.every((sample, index) => sample.color === previous.colors[index]);
      return { samples, colors: sameColors ? previous.colors : samples.map((sample) => sample.color) };
    });
  }
  const [selectedId, setSelectedId] = useState<number>();
  const [anchorId, setAnchorId] = useState<number>();
  const [selection, setSelection] = useState<Selection>('auto');
  const [mode, setMode] = useState<WheelMode>('natural');
  const [strength, setStrength] = useState(0.6);
  const [maxShift, setMaxShift] = useState(30);
  const [tolerance, setTolerance] = useState(5);
  const [intention, setIntention] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoSampleCount, setAutoSampleCount] = useState<AutoSampleCount>(5);
  const [autoSampleUndo, setAutoSampleUndo] = useState<{ ids: number[]; selectedId?: number }>();
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);
  const importSequence = useRef(0);
  const anchorIndex =
    anchorId === undefined ? undefined : samples.findIndex((sample) => sample.id === anchorId);
  const rankings = useMemo(() => rankHarmonies(colors, anchorIndex), [colors, anchorIndex]);
  const fit = useMemo(
    () =>
      selection === 'auto' || selection === 'custom'
        ? rankings[0]
        : fitHarmony(colors, selection, anchorIndex),
    [selection, rankings, colors, anchorIndex],
  );
  const isCustom = selection === 'custom';
  const selected = samples.find((sample) => sample.id === selectedId);
  const chromaticCount = colors.filter(hasMeaningfulHue).length;

  async function importPhoto(file?: File) {
    if (!file) return;
    const sequence = ++importSequence.current;
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const decoded = await decodePhoto(file);
      if (sequence !== importSequence.current) return;
      setPhoto(decoded);
      clearSamples();
      setSelection('auto');
      setMode('natural');
      nextId.current = 1;
    } catch (cause) {
      if (sequence === importSequence.current)
        setError(cause instanceof Error ? cause.message : 'Could not open this photo. Try another file.');
    } finally {
      if (sequence === importSequence.current) setIsLoading(false);
    }
  }

  function placeSample(position: { x: number; y: number }, id?: number) {
    if (!photo) return;
    const existing = id !== undefined;
    if (!existing && samples.length >= 16) {
      setMessage('You have 16 samples. Remove one to add another.');
      return;
    }
    const sampleId = id ?? nextId.current++;
    const color = samplePhoto(photo, position);
    setSamples((previous) =>
      existing
        ? previous.map((sample) => (sample.id === sampleId ? { ...sample, ...position, color } : sample))
        : [...previous, { id: sampleId, ...position, color, name: '' }],
    );
    if (sampleId === anchorId && !hasMeaningfulHue(color)) setAnchorId(undefined);
    setSelectedId(sampleId);
    return sampleId;
  }

  function updateSample(id: number, updates: Partial<Pick<Sample, 'name' | 'customHue'>>) {
    setSamples((previous) =>
      previous.map((sample) => (sample.id === id ? { ...sample, ...updates } : sample)),
    );
  }
  function removeSample(id: number) {
    setSamples((previous) => previous.filter((sample) => sample.id !== id));
    if (anchorId === id) setAnchorId(undefined);
    if (selectedId === id) setSelectedId(undefined);
  }
  function clearSamples() {
    setSamples([]);
    setSelectedId(undefined);
    setAnchorId(undefined);
    setAutoSampleUndo(undefined);
  }

  function autoSample() {
    if (!photo || isLoading || samples.length >= 16) return;
    const extracted = extractPhotoSamples(photo, autoSampleCount);
    const missing = extracted.filter(
      (candidate) => !samples.some((sample) => areSimilarColors(candidate.color, sample.color)),
    );
    const added = missing.slice(0, 16 - samples.length).map((candidate) => ({
      ...candidate,
      id: nextId.current++,
      name: '',
    }));
    if (!added.length) {
      setMessage('These dominant colors are already sampled. Drag a dot to refine your study.');
      return;
    }
    setSamples((previous) => [...previous, ...added]);
    setAutoSampleUndo({ ids: added.map((sample) => sample.id), selectedId });
    setSelectedId(added[0]?.id);
    setMessage(
      `Added ${added.length} dominant color${added.length === 1 ? '' : 's'}. Drag the dots to refine.${added.length < missing.length ? ' The 16-sample limit has been reached.' : ''}`,
    );
  }

  function undoAutoSample() {
    if (!autoSampleUndo) return;
    const { ids, selectedId: previousSelectedId } = autoSampleUndo;
    setSamples((previous) => previous.filter((sample) => !ids.includes(sample.id)));
    if (selectedId !== undefined && ids.includes(selectedId))
      setSelectedId(
        samples.some((sample) => sample.id === previousSelectedId) ? previousSelectedId : undefined,
      );
    if (anchorId !== undefined && ids.includes(anchorId)) setAnchorId(undefined);
    setAutoSampleUndo(undefined);
    setMessage('Auto-sampled colors removed. Your other samples are kept.');
  }

  function clearWorkspace() {
    ++importSequence.current;
    setIsLoading(false);
    setPhoto(undefined);
    clearSamples();
    setMessage('Photo cleared from this workspace.');
  }

  function loadDemo() {
    ++importSequence.current;
    setIsLoading(false);
    const demo = createDemo();
    setPhoto(demo.photo);
    setAutoSampleUndo(undefined);
    setSamples(demo.samples);
    nextId.current = 7;
    setSelectedId(1);
    setAnchorId(undefined);
    setError('');
    setMode('guide');
    setSelection('auto');
    setMessage('Demo uses a six-color study. Open your own photo to sample real subjects.');
  }
  async function copyHex(hex: string) {
    try {
      await navigator.clipboard.writeText(hex);
      setMessage(`${hex} copied.`);
    } catch {
      setMessage(`Copy is unavailable here. Select this value to copy: ${hex}`);
    }
  }
  function chooseHarmony(value: Selection) {
    setSelection(value);
    setMode('guide');
    if (value === 'custom')
      setSamples((previous) =>
        previous.map((sample, index) => ({
          ...sample,
          customHue: sample.customHue ?? fit?.targets[index] ?? sample.color.h,
        })),
      );
  }

  return {
    photo,
    samples,
    selectedId,
    setSelectedId,
    anchorId,
    setAnchorId,
    selection,
    mode,
    setMode,
    strength,
    setStrength,
    maxShift,
    setMaxShift,
    tolerance,
    setTolerance,
    intention,
    setIntention,
    message,
    setMessage,
    error,
    isLoading,
    autoSampleCount,
    setAutoSampleCount,
    canUndoAutoSample:
      autoSampleUndo !== undefined && samples.some((sample) => autoSampleUndo.ids.includes(sample.id)),
    autoSample,
    undoAutoSample,
    isDraggingFile,
    setIsDraggingFile,
    fileInput,
    rankings,
    fit,
    isCustom,
    selected,
    chromaticCount,
    importPhoto,
    placeSample,
    updateSample,
    removeSample,
    clearSamples,
    clearWorkspace,
    loadDemo,
    copyHex,
    chooseHarmony,
  };
}
