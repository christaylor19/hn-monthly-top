import { createSignal, createEffect, For, Show } from 'solid-js';
import { fetchTopStoriesForMonth } from './api/hn';
import MonthPicker from './components/MonthPicker';
import StoryRow from './components/StoryRow';
import Loading from './components/Loading';
import SettingsPanel from './components/SettingsPanel';

function getDefaultMonth() {
  // Check URL hash first
  const hash = window.location.hash.slice(1);
  if (hash) {
    const match = hash.match(/^(\d{4})-(\d{1,2})$/);
    if (match) {
      return { year: parseInt(match[1]), month: parseInt(match[2]) };
    }
  }
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

const STORIES_PER_PAGE = 30;

function App() {
  const defaults = getDefaultMonth();
  const [year, setYear] = createSignal(defaults.year);
  const [month, setMonth] = createSignal(defaults.month);
  const [stories, setStories] = createSignal([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal(null);
  const [visibleCount, setVisibleCount] = createSignal(STORIES_PER_PAGE);

  // Update hash when month/year changes
  createEffect(() => {
    const m = month();
    const y = year();
    window.location.hash = `${y}-${String(m).padStart(2, '0')}`;
  });

  // Fetch stories when month/year changes
  createEffect(() => {
    const y = year();
    const m = month();
    setLoading(true);
    setError(null);
    setStories([]);
    setVisibleCount(STORIES_PER_PAGE);

    fetchTopStoriesForMonth(y, m)
      .then((data) => {
        setStories(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  });

  const visibleStories = () => stories().slice(0, visibleCount());
  const hasMore = () => stories().length > visibleCount();

  function showMore() {
    setVisibleCount((c) => c + STORIES_PER_PAGE);
  }

  // Listen for hash changes (back/forward)
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    const match = hash.match(/^(\d{4})-(\d{1,2})$/);
    if (match) {
      setYear(parseInt(match[1]));
      setMonth(parseInt(match[2]));
    }
  });

  return (
    <>
      <div class="header">
        <span class="header-logo">Y</span>
        <span class="header-title">Hacker News Monthly Top</span>
        <MonthPicker
          month={month()}
          year={year()}
          onMonthChange={setMonth}
          onYearChange={setYear}
        />
        <SettingsPanel />
      </div>

      <Show when={loading()}>
        <Loading />
      </Show>

      <Show when={error()}>
        <div class="error">Error: {error()}</div>
      </Show>

      <Show when={!loading() && !error() && stories().length === 0}>
        <div class="empty">No stories found for this month.</div>
      </Show>

      <Show when={!loading() && stories().length > 0}>
        <div class="story-list">
          <For each={visibleStories()}>
            {(story, i) => (
              <StoryRow story={story} rank={i() + 1} />
            )}
          </For>
        </div>
        <Show when={hasMore()}>
          <div class="more-link">
            <a href="#" onClick={(e) => { e.preventDefault(); showMore(); }}>
              More
            </a>
          </div>
        </Show>
      </Show>

      <div class="footer">
        Data from Algolia HN Search API | Top stories by points
      </div>
    </>
  );
}

export default App;
