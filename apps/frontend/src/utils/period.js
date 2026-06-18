// Hash URL scheme for the selected period:
//   2026        -> { granularity: 'year',  year: 2026 }
//   2026-06     -> { granularity: 'month', year: 2026, month: 6 }
//   2026-W25    -> { granularity: 'week',  year: 2026, week: 25 }
//
// The month scheme matches the original shareable-URL format, so links shared
// before period selection existed keep resolving.

export function parsePeriodHash(hash) {
  const h = hash.replace(/^#/, '');

  let m = h.match(/^(\d{4})-W(\d{1,2})$/);
  if (m) {
    return { granularity: 'week', year: parseInt(m[1]), week: parseInt(m[2]) };
  }

  m = h.match(/^(\d{4})-(\d{1,2})$/);
  if (m) {
    return { granularity: 'month', year: parseInt(m[1]), month: parseInt(m[2]) };
  }

  m = h.match(/^(\d{4})$/);
  if (m) {
    return { granularity: 'year', year: parseInt(m[1]) };
  }

  return null;
}

export function periodToHash(period) {
  if (period.granularity === 'year') return `${period.year}`;
  if (period.granularity === 'week') {
    return `${period.year}-W${String(period.week).padStart(2, '0')}`;
  }
  return `${period.year}-${String(period.month).padStart(2, '0')}`;
}

// Human-readable label for the empty/heading states.
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function periodLabel(period) {
  if (period.granularity === 'year') return `${period.year}`;
  if (period.granularity === 'week') return `week ${period.week}, ${period.year}`;
  return `${MONTH_NAMES[period.month - 1]} ${period.year}`;
}
