import { createSignal } from 'solid-js';

const STORAGE_KEY = 'hn-settings';

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function save(val) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
}

const saved = load();

export const VERBOSITY_LEVELS = [
  { value: 'concise',  label: 'Concise',  article: '1 sentence summary and 2-3 bullet points', comments: '2-3 sentences total' },
  { value: 'balanced', label: 'Balanced', article: '1 sentence summary and 3-5 bullet points', comments: '3-5 sentences total' },
  { value: 'detailed', label: 'Detailed', article: '2-3 sentence summary and 5-7 bullet points with extra context', comments: '5-7 sentences with expanded detail' },
];

export const [verbosity, setVerbosity] = createSignal(
  VERBOSITY_LEVELS.find((l) => l.value === saved.verbosity) ?? VERBOSITY_LEVELS[1]
);

export function updateVerbosity(value) {
  const level = VERBOSITY_LEVELS.find((l) => l.value === value);
  if (!level) return;
  setVerbosity(level);
  save({ ...load(), verbosity: value });
}
