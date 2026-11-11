export interface Comment {
  author: string;
  text: string;
  depth: number;
}

interface AlgoliaNode {
  type: string;
  author: string;
  text: string | null;
  children?: AlgoliaNode[];
}

interface AlgoliaItem {
  children?: AlgoliaNode[];
}

export async function fetchComments(storyId: string): Promise<Comment[]> {
  const res = await fetch(`https://hn.algolia.com/api/v1/items/${storyId}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = (await res.json()) as AlgoliaItem;
  return extractComments(data.children || [], 0, 60);
}

function extractComments(nodes: AlgoliaNode[], depth: number, limit: number): Comment[] {
  const results: Comment[] = [];
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

function stripHtml(html: string): string {
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
