const BASE_URL = 'https://hn.algolia.com/api/v1/search';

function getMonthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return {
    start: Math.floor(start.getTime() / 1000),
    end: Math.floor(end.getTime() / 1000),
  };
}

export async function fetchTopStoriesForMonth(year, month, minPoints = 50) {
  const { start, end } = getMonthRange(year, month);
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
    return fetchTopStoriesForMonth(year, month, minPoints * 2);
  }

  filtered.sort((a, b) => b.points - a.points);
  return filtered;
}
