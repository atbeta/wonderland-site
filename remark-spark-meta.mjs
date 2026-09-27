// remark plugin: turn spark-card metadata lines into <div class="spark-meta">
//
// Walks each paragraph's inline children. A paragraph qualifies as a spark
// metadata block when its first inline child is a `<strong>` whose text
// matches one of the known metadata keys (碰撞 / 连接点 / 锚点 / 族 / 状态 /
// 如果要做 / 画面 / 惊讶度 / 具体度 / 可行动度). Subsequent values are
// collected until the next <strong>**K**: marker.
//
// The output is editorial, not a record table — no dt/dd label column:
//   tags row  : 族 chip + compact scores (惊讶 9 · 具体 9 · 可行 8)
//   lede      : 连接点, full-width prose
//   callout   : 如果要做, highlighted note
//   folds     : 锚点 (参考文献) and 画面 (生图提示词) in <details>;
//               an image embedded in 画面 stays visible outside the fold
// Dropped entirely: 碰撞 (the group heading already carries A × B) and
// 状态 (the constant "火花" archive-wide).
//
// Also catches depth-2 headings whose first inline child is a meta key: a
// `---` on the very next line after a meta paragraph is a setext underline,
// so those paragraphs arrive as h2 nodes (a few old archives miss the blank
// line). Same inline shape, same handling.

import { visit, SKIP } from 'unist-util-visit';

const META_KEYS = new Set([
  '碰撞', '连接点', '锚点', '族', '状态', '如果要做', '画面',
  '惊讶度', '具体度', '可行动度',
]);

const DROP_KEYS = new Set(['碰撞', '状态']);

const SCORE_ORDER = ['惊讶度', '具体度', '可行动度'];
const SCORE_LABELS = { 惊讶度: '惊讶', 具体度: '具体', 可行动度: '可行' };

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function isStrong(node) {
  return node && node.type === 'strong';
}

function strongText(node) {
  // node.children should be text-like; flatten to plain text.
  if (!node || !Array.isArray(node.children)) return '';
  return node.children
    .map((c) => (c.type === 'text' ? c.value : ''))
    .join('');
}

// Render an inline node array to a plain string (best-effort, no HTML escapes).
// Image / link nodes are reconstructed as markdown so the rendered HTML still
// shows them. Code becomes inline backticks.
function inlineToPlain(children) {
  if (!Array.isArray(children)) return '';
  return children
    .map((c) => {
      if (c.type === 'text') return c.value;
      if (c.type === 'strong') return `**${inlineToPlain(c.children)}**`;
      if (c.type === 'emphasis') return `*${inlineToPlain(c.children)}*`;
      if (c.type === 'inlineCode') return `\`${c.value}\``;
      if (c.type === 'link') return `[${inlineToPlain(c.children)}](${c.url || ''})`;
      if (c.type === 'image') return `![${c.alt || ''}](${c.url || ''})`;
      if (c.type === 'break') return '\n';
      return '';
    })
    .join('');
}

const cleanValue = (v) => v.replace(/^[\s]*[:：]\s*/, '').trim();

// 锚点 entries are separated by " / " or " | ". Whitespace around the slash
// is required so "Zymergen/Ginkgo" and "top/heart/base" survive intact.
function splitRefs(refs) {
  return refs
    .split(/\s*\|\s*|\s+\/\s*|\s\/\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

// Leading identifiers become mono chips linked to their resolver.
const REF_ID_PATTERNS = [
  [/^(arXiv:)([a-z-]+(?:\.[a-z]{2})?\/\d{7}|\d{4}\.\d{4,5})(v\d+)?/i, (m) => `https://arxiv.org/abs/${m[2]}`],
  [/^(PMC)(\d{5,})\b/i, (m) => `https://pmc.ncbi.nlm.nih.gov/articles/PMC${m[2]}/`],
  [/^(PMID:?)\s*(\d{6,})\b/i, (m) => `https://pubmed.ncbi.nlm.nih.gov/${m[2]}/`],
  [/^(DOI:?\s*)(10\.\d{4,9}\/\S+)/i, (m) => `https://doi.org/${m[2]}`],
  [/^(IEEE\s*)(\d{5,})\b/, (m) => `https://ieeexplore.ieee.org/document/${m[2]}`],
];

function renderRef(entry) {
  for (const [re, toUrl] of REF_ID_PATTERNS) {
    const m = entry.match(re);
    if (!m) continue;
    const id = m[0];
    const rest = entry.slice(id.length).trim();
    return (
      `<a class="ref-id" href="${toUrl(m)}" target="_blank" rel="noopener">${escapeHtml(id)}</a>` +
      (rest ? escapeHtml(rest) : '')
    );
  }
  return escapeHtml(entry);
}

// Assemble the meta div in a fixed editorial order, regardless of the
// source order of the fields.
function buildMeta(items) {
  const byKey = new Map();
  for (const it of items) {
    if (!byKey.has(it.key)) byKey.set(it.key, it.value);
  }
  const get = (k) => (byKey.has(k) ? cleanValue(byKey.get(k)) : null);

  const frag = [];

  // tags row: 族 chip + compact score line
  const tags = [];
  const family = get('族');
  if (family) tags.push(`<span class="chip spark-family">${escapeHtml(family)}</span>`);
  const scores = [];
  for (const k of SCORE_ORDER) {
    const v = get(k);
    if (v === null) continue;
    const m = v.match(/(\d+)/);
    scores.push(`${SCORE_LABELS[k]} ${m ? m[1] : v}`);
  }
  if (scores.length) {
    tags.push(`<span class="spark-scores">${escapeHtml(scores.join(' · '))}</span>`);
  }
  if (tags.length) frag.push(`<p class="spark-tags">${tags.join('')}</p>`);

  const lede = get('连接点');
  if (lede) frag.push(`<p class="spark-lede">${escapeHtml(lede)}</p>`);

  const todo = get('如果要做');
  if (todo) {
    frag.push(
      `<p class="spark-todo"><span class="todo-label">如果要做</span>${escapeHtml(todo)}</p>`
    );
  }

  const refs = get('锚点');
  if (refs) {
    const entries = splitRefs(refs);
    const items = entries.map((e) => `<li>${renderRef(e)}</li>`).join('');
    frag.push(
      `<details class="spark-fold"><summary>参考文献 <span class="fold-count">${entries.length}</span></summary><ol class="spark-refs">${items}</ol></details>`
    );
  }

  const visual = get('画面');
  let figure = '';
  if (visual) {
    const imgMatch = visual.match(/!\[([^\]]*)\]\(([^)]+)\)/);
    const text = visual.replace(imgMatch ? imgMatch[0] : '', '').trim();
    if (text) {
      frag.push(
        `<details class="spark-fold"><summary>生图提示词</summary><p>${escapeHtml(text)}</p></details>`
      );
    }
    if (imgMatch) {
      // Emit the image as a standalone figure right after the meta div; the
      // rehype wrapper pulls it into the card as its bottom full-bleed image.
      figure =
        `<p class="spark-figure"><img src="${escapeHtml(imgMatch[2])}" alt="${escapeHtml(imgMatch[1])}" loading="lazy" /></p>`;
    }
  }

  return { html: frag.join(''), figure };
}

export default function remarkWonderlandSparkMeta() {
  return (tree) => {
    visit(tree, ['paragraph', 'heading'], (node, index, parent) => {
      if (!parent || index == null) return;
      // Only setext-swallowed meta blocks: a depth-2 heading whose first
      // inline child is a meta key. Real section headings never match.
      if (node.type === 'heading' && node.depth !== 2) return;
      const children = node.children;
      if (!Array.isArray(children) || children.length === 0) return;

      // First inline token must be a <strong> matching a known key.
      const first = children[0];
      if (!isStrong(first)) return;
      const firstKey = strongText(first).trim();
      if (!META_KEYS.has(firstKey)) return;

      // Walk children, alternating key spans and value spans. A "key span" =
      // a <strong> child whose text is a known META_KEYS entry.
      const items = [];
      let current = null;
      const flush = () => {
        if (current) {
          items.push({ key: current.key, value: current.value });
          current = null;
        }
      };
      for (let i = 0; i < children.length; i++) {
        const c = children[i];
        if (isStrong(c)) {
          const k = strongText(c).trim();
          if (META_KEYS.has(k)) {
            flush();
            current = { key: k, value: '' };
            continue;
          }
          // A non-meta <strong> — treat its inline text as part of the current value.
          if (current) current.value += inlineToPlain(c.children);
          continue;
        }
        if (current) {
          current.value += inlineToPlain([c]);
        }
      }
      flush();

      const kept = items.filter(({ key }) => !DROP_KEYS.has(key));
      if (kept.length === 0) {
        // Paragraph carried only dropped rows — remove it entirely.
        parent.children.splice(index, 1);
        return [SKIP, index];
      }

      const { html, figure } = buildMeta(kept);
      const metaNode = { type: 'html', value: `<div class="spark-meta">${html}</div>` };
      if (figure) {
        parent.children.splice(index, 1, metaNode, { type: 'html', value: figure });
        return [SKIP, index + 2];
      }
      parent.children[index] = metaNode;
      return [SKIP, index + 1];
    });
  };
}
