import { createSignal } from 'solid-js';
import SummaryPanel from './SummaryPanel';
import { timeAgo } from '../utils/time';

function extractDomain(url) {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

export default function StoryRow(props) {
  const [summaryOpen, setSummaryOpen] = createSignal(false);
  const domain = () => extractDomain(props.story.url);
  const hnUrl = () => `https://news.ycombinator.com/item?id=${props.story.objectID}`;

  return (
    <div class="story-row">
      <div class="story-title-line">
        <span class="story-rank">{props.rank}.</span>
        <span class="story-title">
          <a href={props.story.url || hnUrl()} target="_blank" rel="noopener">
            {props.story.title}
          </a>
        </span>
        {domain() && (
          <span class="story-domain">
            ({domain()})
          </span>
        )}
      </div>
      <div class="story-subtext">
        {props.story.points} points by {props.story.author} |{' '}
        <a href={hnUrl()} target="_blank" rel="noopener">
          {timeAgo(props.story.created_at_i)}
        </a>{' '}
        |{' '}
        <a href={hnUrl()} target="_blank" rel="noopener">
          {props.story.num_comments ?? 0} comments
        </a>{' '}
        |{' '}
        <button
          class={`summarise-btn${summaryOpen() ? ' active' : ''}`}
          onClick={() => setSummaryOpen((v) => !v)}
        >
          {summaryOpen() ? 'hide summary' : 'summarise'}
        </button>
      </div>
      <SummaryPanel open={summaryOpen()} story={props.story} />
    </div>
  );
}
