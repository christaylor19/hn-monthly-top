import { createSignal, createEffect, onMount, onCleanup, For, Show } from 'solid-js';
import { fetchTopStories } from './api/hn';
import { parsePeriodHash, periodToHash, periodLabel } from './utils/period';
import MonthPicker from './components/MonthPicker';
import StoryRow from './components/StoryRow';
import Loading from './components/Loading';
import SettingsPanel from './components/SettingsPanel';
import AuthPanel from './components/AuthPanel';

function getDefaultPeriod() {
  const fromHash = parsePeriodHash(window.location.hash);
  if (fromHash) return fromHash;
  const now = new Date();
  return { granularity: 'month', year: now.getFullYear(), month: now.getMonth() + 1 };
}

const STORIES_PER_PAGE = 30;

function App() {
  const [period, setPeriod] = createSignal(getDefaultPeriod());
  const [stories, setStories] = createSignal([]);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal(null);
  const [visibleCount, setVisibleCount] = createSignal(STORIES_PER_PAGE);

  // Keep the hash in sync with the selected period.
  createEffect(() => {
    window.location.hash = periodToHash(period());
  });

  // Fetch stories whenever the period changes. Tracking period() makes this
  // effect re-run on any granularity/year/month/week change.
  createEffect(() => {
    const p = period();
    setLoading(true);
    setError(null);
    setStories([]);
    setVisibleCount(STORIES_PER_PAGE);

    fetchTopStories(p)
      .then((data) => {
        setStories(data);
        setLoading(false);
        window.scrollTo({ top: 0 });
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

  // Sync state from the hash on back/forward navigation. Registered once via
  // onMount and torn down via onCleanup so we don't leak a listener per render.
  onMount(() => {
    const onHashChange = () => {
      const parsed = parsePeriodHash(window.location.hash);
      if (parsed) setPeriod(parsed);
    };
    window.addEventListener('hashchange', onHashChange);
    onCleanup(() => window.removeEventListener('hashchange', onHashChange));
  });

  return (
    <>
      <div class="header">
        <span class="header-logo">Y</span>
        <span class="header-title">Hacker News Monthly Top</span>
        <MonthPicker period={period()} onChange={setPeriod} />
        <SettingsPanel />
        <AuthPanel />
      </div>

      <Show when={loading()}>
        <Loading />
      </Show>

      <Show when={error()}>
        <div class="error">Error: {error()}</div>
      </Show>

      <Show when={!loading() && !error() && stories().length === 0}>
        <div class="empty">No stories found for {periodLabel(period())}.</div>
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
