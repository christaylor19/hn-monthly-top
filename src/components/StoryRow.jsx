import { createSignal } from 'solid-js';
import SummaryPanel from './SummaryPanel';

function extractDomain(url) {
  if (!url) return null;
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

function timeAgo(timestamp) {
  const seconds = Math.floor(Date.now() / 1000) - timestamp;
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
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
