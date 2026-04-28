const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;
const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4.1-mini';

async function callOpenAI(systemPrompt, userContent) {
  if (!OPENAI_API_KEY) throw new Error('No OpenAI API key set. Add VITE_OPENAI_API_KEY to your .env file.');

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
      max_tokens: 400,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI error: ${res.status}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

export async function summariseArticle(title, url) {
  let articleContent = null;

  try {
    const readerUrl = `https://r.jina.ai/${url}`;
    const res = await fetch(readerUrl, {
      headers: { Accept: 'text/plain' },
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const text = await res.text();
      articleContent = text.slice(0, 6000);
    }
  } catch {
    // Jina failed or timed out — fall back to title-only
  }

  const system = `You summarise articles for Hacker News readers. Be concise — 3 to 5 sentences.
Focus on the key argument or finding. No filler phrases like "the article discusses" or "in conclusion".`;

  const user = articleContent
    ? `Title: ${title}\n\nContent:\n${articleContent}`
    : `Title: ${title}\n\n(Article content could not be fetched — summarise based on the title only, and note that.)`;

  return callOpenAI(system, user);
}

export async function summariseComments(title, comments) {
  if (!comments.length) throw new Error('No comments to summarise.');

  const formatted = comments
    .slice(0, 40)
    .map((c) => `- ${c.author}: ${c.text.slice(0, 300)}`)
    .join('\n');

  const system = `You summarise Hacker News comment threads for a reader who wants the gist without reading everything.
Write 3 to 5 sentences. Cover the dominant themes, notable disagreements, and any strong consensus.
Be direct. No filler.`;

  const user = `Story: "${title}"\n\nComments:\n${formatted}`;

  return callOpenAI(system, user);
}
