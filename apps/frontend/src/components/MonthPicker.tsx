import { For, Show } from 'solid-js';
import { isoWeeksInYear, currentIsoWeek } from '../api/hn';
import type { Granularity, Period } from '../utils/period';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const START_YEAR = 2007;
const GRANULARITIES: Granularity[] = ['week', 'month', 'year'];

// The period is { granularity, year, month?, week? }. The picker emits a whole
// new period object via props.onChange — App owns the state.
export default function MonthPicker(props: { period: Period; onChange: (period: Period) => void }) {
  const now = new Date();
  const currentYear = now.getFullYear();

  const years: number[] = [];
  for (let y = currentYear; y >= START_YEAR; y--) {
    years.push(y);
  }

  const period = () => props.period;

  function update(patch: Partial<Period>) {
    props.onChange({ ...period(), ...patch });
  }

  // Switching granularity: backfill the field the new granularity needs so the
  // period object is always complete (month -> week keeps year, adds week 1).
  function changeGranularity(granularity: Granularity) {
    const next: Period = { granularity, year: period().year };
    if (granularity === 'month') next.month = period().month ?? now.getMonth() + 1;
    if (granularity === 'week') next.week = period().week ?? currentIsoWeek(next.year);
    props.onChange(next);
  }

  const weeks = () => {
    const count = isoWeeksInYear(period().year);
    return Array.from({ length: count }, (_, i) => i + 1);
  };

  return (
    <div class="header-nav">
      <select
        class="granularity-select"
        value={period().granularity}
        onChange={(e) => changeGranularity(e.currentTarget.value as Granularity)}
      >
        <For each={GRANULARITIES}>
          {(g) => <option value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>}
        </For>
      </select>

      <Show when={period().granularity === 'week'}>
        <select
          value={period().week}
          onChange={(e) => update({ week: parseInt(e.currentTarget.value, 10) })}
        >
          <For each={weeks()}>{(w) => <option value={w}>W{w}</option>}</For>
        </select>
      </Show>

      <Show when={period().granularity === 'month'}>
        <select
          value={period().month}
          onChange={(e) => update({ month: parseInt(e.currentTarget.value, 10) })}
        >
          <For each={MONTHS}>{(name, i) => <option value={i() + 1}>{name}</option>}</For>
        </select>
      </Show>

      <select
        value={period().year}
        onChange={(e) => update({ year: parseInt(e.currentTarget.value, 10) })}
      >
        <For each={years}>{(y) => <option value={y}>{y}</option>}</For>
      </select>
    </div>
  );
}
