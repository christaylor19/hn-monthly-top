const BASE_URL = 'https://hn.algolia.com/api/v1/search';

// --- Period -> unix [start, end) range -------------------------------------
//
// A period is { granularity: 'year' | 'month' | 'week', year, month?, week? }.
// All ranges are half-open: start inclusive, end exclusive, matching the
// existing `created_at_i>start,created_at_i<end` Algolia filter.

function toUnix(date) {
  return Math.floor(date.getTime() / 1000);
}

// Monday of ISO week 1 for a given year. ISO 8601: week 1 is the week
// containing the first Thursday, equivalently the week containing Jan 4th.
function isoWeek1Monday(year) {
  const jan4 = new Date(year, 0, 4);
  const day = jan4.getDay() || 7; // getDay(): Sun=0 -> treat as 7
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - (day - 1));
  return monday;
}

function getPeriodRange(period) {
  const { granularity, year, month, week } = period;

  if (granularity === 'year') {
    return {
      start: toUnix(new Date(year, 0, 1)),
      end: toUnix(new Date(year + 1, 0, 1)),
    };
  }

  if (granularity === 'week') {
    const start = isoWeek1Monday(year);
    start.setDate(start.getDate() + (week - 1) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start: toUnix(start), end: toUnix(end) };
  }

  // month (default)
  return {
    start: toUnix(new Date(year, month - 1, 1)),
    end: toUnix(new Date(year, month, 1)),
  };
}

// Number of ISO weeks in a year (52 or 53) — a year has 53 weeks when it
// starts on a Thursday, or is a leap year starting on a Wednesday.
export function isoWeeksInYear(year) {
  const jan1Day = new Date(year, 0, 1).getDay();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  if (jan1Day === 4 || (isLeap && jan1Day === 3)) return 53;
  return 52;
}

export async function fetchTopStories(period, minPoints = 50) {
  const { start, end } = getPeriodRange(period);
  const stories = [];
  let page = 0;
  const maxPages = 10; // cap at 1000 results

  while (page < maxPages) {
    const filters = `created_at_i>${start},created_at_i<${end}`;
    const url = `${BASE_URL}?tags=story&numericFilters=${encodeURIComponent(filters)}&hitsPerPage=100&page=${page}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }

    const data = await res.json();
    stories.push(...data.hits);

    if (page >= data.nbPages - 1) break;
    page++;
  }

  const filtered = stories.filter((s) => (s.points ?? 0) >= minPoints);

  // If too many results, retry with higher threshold
  if (filtered.length > 900 && minPoints < 200) {
    return fetchTopStories(period, minPoints * 2);
  }

  filtered.sort((a, b) => b.points - a.points);
  return filtered;
}
