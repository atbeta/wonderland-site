// remark plugin: turn spark-card metadata lines into <dl class="spark-meta">
//
// Walks each paragraph's inline children. A paragraph qualifies as a spark
// metadata block when its first inline child is a `<strong>` whose text
// matches one of the known metadata keys (碰撞 / 连接点 / 锚点 / 族 / 状态 /
// 如果要做 / 画面 / 惊讶度 / 具体度 / 可行动度). Subsequent values are
// collected until the next <strong>**K**: marker; everything between
// markers becomes one <dd> for that <dt>.

import { visit, SKIP } from 'unist-util-visit';

const META_KEYS = new Set([
  '碰撞', '连接点', '锚点', '族', '状态', '如果要做', '画面',
  '惊讶度', '具体度', '可行动度',
]);

const SCORE_KEYS = new Set(['惊讶度', '具体度', '可行动度']);

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

export default function remarkWonderlandSparkMeta() {
  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || index == null) return;
      const children = node.children;
      if (!Array.isArray(children) || children.length === 0) return;

      // First inline token must be a <strong> matching a known key.
      const first = children[0];
      if (!isStrong(first)) return;
      const firstKey = strongText(first).trim();
      if (!META_KEYS.has(firstKey)) return;

      // Walk children, alternating key spans (rendered as <dt>) and value
      // spans (rendered as <dd>). A "key span" = a <strong> child whose text
      // is a known META_KEYS entry. We allow leading text before the first
      // key (rare, but tolerant).
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

      if (items.length === 0) return;

      const parts = items.map(({ key, value }) => {
        const isScore = SCORE_KEYS.has(key);
        const dtClass = isScore ? 'dt-score' : 'dt-meta';
        const ddClass = isScore ? 'dd-score' : 'dd-meta';

        // Strip the leading ": " that comes from `**K**: value` markdown.
        // Image / link syntax inside the value is preserved and re-emitted.
        const cleaned = value.replace(/^[\s]*[:：]\s*/, '');
        let ddInner;
        if (isScore) {
          const numMatch = cleaned.match(/(\d+)/);
          const num = numMatch ? Number(numMatch[1]) : null;
          if (num !== null) {
            ddInner =
              `<span class="score-num">${num}</span>` +
              `<span class="score-bar" aria-hidden="true">` +
                `<span class="score-bar-fill" style="width:${num * 10}%"></span>` +
              `</span>`;
          } else {
            ddInner = escapeHtml(cleaned);
          }
        } else {
          // If the value carries an image, splice it out and emit as real <img>
          // so the browser renders it. Otherwise fall back to escaped text.
          const imgMatch = cleaned.match(/!\[([^\]]*)\]\(([^)]+)\)/);
          if (imgMatch) {
            const alt = escapeHtml(imgMatch[1]);
            const url = escapeHtml(imgMatch[2]);
            const text = cleaned.replace(imgMatch[0], '').trim();
            ddInner = (text ? `${escapeHtml(text)}<br>` : '') +
                      `<img class="dd-image" src="${url}" alt="${alt}" loading="lazy" />`;
          } else {
            ddInner = escapeHtml(cleaned.trim());
          }
        }
        return `<dt class="${dtClass}">${escapeHtml(key)}</dt>` +
               `<dd class="${ddClass}">${ddInner}</dd>`;
      }).join('');

      const dlHtml = `<dl class="spark-meta">${parts}</dl>`;

      parent.children[index] = { type: 'html', value: dlHtml };
      return [SKIP, index + 1];
    });
  };
}