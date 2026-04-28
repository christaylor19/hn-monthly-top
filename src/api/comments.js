export async function fetchComments(storyId) {
  const res = await fetch(
    `https://hn.algolia.com/api/v1/items/${storyId}`
  );
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return extractComments(data.children || [], 0, 60);
}

function extractComments(nodes, depth, limit) {
  const results = [];
  for (const node of nodes) {
    if (results.length >= limit) break;
    if (node.type === 'comment' && node.text) {
      results.push({
        author: node.author,
        text: stripHtml(node.text),
        depth,
      });
    }
    if (node.children?.length) {
      results.push(...extractComments(node.children, depth + 1, limit - results.length));
    }
  }
  return results;
}

function stripHtml(html) {
  return html
    .replace(/<p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}
