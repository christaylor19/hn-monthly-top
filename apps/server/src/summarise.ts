const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';
const JINA_API_KEY = process.env.JINA_API_KEY;

const VERBOSITY = {
  concise: { article: '1 sentence summary and 2-3 bullet points', comments: '2-3 sentences total' },
  balanced: { article: '1 sentence summary and 3-5 bullet points', comments: '3-5 sentences total' },
  detailed: {
    article: '2-3 sentence summary and 5-7 bullet points with extra context',
    comments: '5-7 sentences with expanded detail',
  },
} as const;

type Verbosity = keyof typeof VERBOSITY;

function resolveVerbosity(v: string | undefined): Verbosity {
  return v && v in VERBOSITY ? (v as Verbosity) : 'balanced';
}

async function callOpenAI(systemPrompt: string, userContent: string): Promise<string> {
  if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured on the server.');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 600,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
    throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim();
}

async function fetchArticleContent(url: string): Promise<string | null> {
  try {
    const headers: Record<string, string> = { Accept: 'text/plain' };
    if (JINA_API_KEY) headers.Authorization = `Bearer ${JINA_API_KEY}`;
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 6000);
  } catch {
    return null;
  }
}

export async function summariseArticle(
  title: string,
  url: string | undefined,
  verbosity: string | undefined
): Promise<{ text: string; titleOnly: boolean }> {
  const v = resolveVerbosity(verbosity);
  const articleContent = url ? await fetchArticleContent(url) : null;

  const system = `You summarise articles for Hacker News readers. Respond in markdown.
Use this structure:
**What it is** — one sentence on what the article is.
**Key points** — ${VERBOSITY[v].article}.
**Bottom line** — one sentence on the takeaway.
No filler phrases like "the article discusses" or "in conclusion". Be direct and specific.`;

  const user = articleContent
    ? `Title: ${title}\n\nContent:\n${articleContent}`
    : `Title: ${title}\n\n(Article content could not be fetched — summarise based on the title only.)`;

  const text = await callOpenAI(system, user);
  return { text, titleOnly: !articleContent };
}

export async function summariseComments(
  title: string,
  comments: { author: string; text: string }[],
  verbosity: string | undefined
): Promise<string> {
  if (!comments.length) throw new Error('No comments to summarise.');
  const v = resolveVerbosity(verbosity);

  const formatted = comments
    .slice(0, 40)
    .map((c) => `- ${c.author}: ${c.text.slice(0, 300)}`)
    .join('\n');

  const system = `You summarise Hacker News comment threads. Respond in markdown.
Use this structure:
**Sentiment** — one sentence on the overall tone of the thread.
**Main themes** — bullet points covering dominant topics or arguments.
**Notable disagreements** — bullet points on any meaningful pushback or debate, if present.
Length: ${VERBOSITY[v].comments}. Be direct. No filler.`;

  const user = `Story: "${title}"\n\nComments:\n${formatted}`;

  return callOpenAI(system, user);
}
