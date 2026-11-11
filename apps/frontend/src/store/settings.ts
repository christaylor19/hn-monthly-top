import { createSignal } from 'solid-js';

const STORAGE_KEY = 'hn-settings';

interface StoredSettings {
  verbosity?: string;
}

export type VerbosityValue = 'concise' | 'balanced' | 'detailed';

export interface VerbosityLevel {
  value: VerbosityValue;
  label: string;
  article: string;
  comments: string;
}

function load(): StoredSettings {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as StoredSettings;
  } catch {
    return {};
  }
}

function save(val: StoredSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
}

const saved = load();

export const VERBOSITY_LEVELS: VerbosityLevel[] = [
  {
    value: 'concise',
    label: 'Concise',
    article: '1 sentence summary and 2-3 bullet points',
    comments: '2-3 sentences total',
  },
  {
    value: 'balanced',
    label: 'Balanced',
    article: '1 sentence summary and 3-5 bullet points',
    comments: '3-5 sentences total',
  },
  {
    value: 'detailed',
    label: 'Detailed',
    article: '2-3 sentence summary and 5-7 bullet points with extra context',
    comments: '5-7 sentences with expanded detail',
  },
];

const defaultLevel = VERBOSITY_LEVELS.find((l) => l.value === 'balanced') as VerbosityLevel;

export const [verbosity, setVerbosity] = createSignal<VerbosityLevel>(
  VERBOSITY_LEVELS.find((l) => l.value === saved.verbosity) ?? defaultLevel,
);

export function updateVerbosity(value: string): void {
  const level = VERBOSITY_LEVELS.find((l) => l.value === value);
  if (!level) return;
  setVerbosity(level);
  save({ ...load(), verbosity: value });
}
