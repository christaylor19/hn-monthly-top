import { createSignal, createEffect, Show } from 'solid-js';
import { fetchComments } from '../api/comments';
import { summariseArticle, summariseComments } from '../api/summarise';

export default function SummaryPanel(props) {
  const [activeTab, setActiveTab] = createSignal('article');
  const [articleSummary, setArticleSummary] = createSignal(null);
  const [commentsSummary, setCommentsSummary] = createSignal(null);
  const [articleState, setArticleState] = createSignal('idle'); // idle | loading | done | error
  const [commentsState, setCommentsState] = createSignal('idle');
  const [articleError, setArticleError] = createSignal(null);
  const [commentsError, setCommentsError] = createSignal(null);

  createEffect(() => {
    if (!props.open) return;
    if (activeTab() === 'article' && articleState() === 'idle') {
      loadArticle();
    }
    if (activeTab() === 'comments' && commentsState() === 'idle') {
      loadComments();
    }
  });

  async function loadArticle() {
    setArticleState('loading');
    try {
      const summary = await summariseArticle(props.story.title, props.story.url);
      setArticleSummary(summary);
      setArticleState('done');
    } catch (e) {
      setArticleError(e.message);
      setArticleState('error');
    }
  }

  async function loadComments() {
    setCommentsState('loading');
    try {
      const comments = await fetchComments(props.story.objectID);
      const summary = await summariseComments(props.story.title, comments);
      setCommentsSummary(summary);
      setCommentsState('done');
    } catch (e) {
      setCommentsError(e.message);
      setCommentsState('error');
    }
  }

  function switchTab(tab) {
    setActiveTab(tab);
    if (tab === 'article' && articleState() === 'idle') loadArticle();
    if (tab === 'comments' && commentsState() === 'idle') loadComments();
  }

  return (
    <Show when={props.open}>
      <div class="summary-panel">
        <div class="summary-tabs">
          <button
            class={`summary-tab${activeTab() === 'article' ? ' active' : ''}`}
            onClick={() => switchTab('article')}
          >
            Article
          </button>
          <button
            class={`summary-tab${activeTab() === 'comments' ? ' active' : ''}`}
            onClick={() => switchTab('comments')}
          >
            Comments
          </button>
        </div>

        <div class="summary-body">
          <Show when={activeTab() === 'article'}>
            <SummaryContent
              state={articleState()}
              text={articleSummary()}
              error={articleError()}
              onRetry={loadArticle}
            />
          </Show>
          <Show when={activeTab() === 'comments'}>
            <SummaryContent
              state={commentsState()}
              text={commentsSummary()}
              error={commentsError()}
              onRetry={loadComments}
            />
          </Show>
        </div>
      </div>
    </Show>
  );
}

function SummaryContent(props) {
  return (
    <>
      <Show when={props.state === 'loading'}>
        <span class="summary-loading">Summarising...</span>
      </Show>
      <Show when={props.state === 'done'}>
        <p class="summary-text">{props.text}</p>
      </Show>
      <Show when={props.state === 'error'}>
        <span class="summary-error">{props.error}</span>
        <button class="summary-retry" onClick={props.onRetry}>Retry</button>
      </Show>
    </>
  );
}
