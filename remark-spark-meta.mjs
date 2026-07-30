// remark plugin: turn spark-card metadata lines into <dl class="spark-meta">
//
// Recognizes paragraphs whose first inline token is a known spark metadata key
// (碰撞/连接点/锚点/族/状态/如果要做/画面) or a score key
// (惊讶度/具体度/可行动度), and splits the paragraph text on every
// `**K**:` marker into <dt>/<dd> pairs.

import { visit, SKIP } from 'unist-util-visit';
import { toString as mdastToString } from 'mdast-util-to-string';

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

export default function remarkWonderlandSparkMeta() {
  return (tree) => {
    visit(tree, 'paragraph', (node, index, parent) => {
      if (!parent || index == null) return;
      const text = mdastToString(node);
      if (!text) return;

      // First metadata key determines whether this paragraph is a spark metadata block.
      const headMatch = /^\s*\*\*([^*]+)\*\*:\s*/.exec(text);
      if (!headMatch) return;
      if (!META_KEYS.has(headMatch[1].trim())) return;

      // Walk all `**K**:` markers in order and slice the rest as the value.
      const markerRe = /\*\*([^*]+)\*\*:\s*/g;
      const items = [];
      let m;
      while ((m = markerRe.exec(text)) !== null) {
        const key = m[1].trim();
        if (!META_KEYS.has(key)) continue;
        const valStart = m.index + m[0].length;
        // Find next marker (or end of text).
        const rest = text.slice(valStart);
        const nextMatch = rest.match(/\s*\*\*([^*]+)\*\*:\s*/);
        const valEnd = nextMatch
          ? valStart + nextMatch.index
          : text.length;
        const value = text.slice(valStart, valEnd).trim();
        items.push({ key, value });
      }

      if (items.length === 0) return;

      // Build a definition list. Score keys become <dt class="score"> with the
      // value rendered as a number out of 10 (with a tiny inline bar if numeric).
      const parts = items.map(({ key, value }) => {
        const isScore = SCORE_KEYS.has(key);
        const dtClass = isScore ? 'dt-score' : 'dt-meta';
        const ddClass = isScore ? 'dd-score' : 'dd-meta';

        let ddInner;
        if (isScore) {
          const numMatch = value.match(/(\d+)/);
          const num = numMatch ? Number(numMatch[1]) : null;
          if (num !== null) {
            ddInner = `<span class="score-num">${num}</span>` +
                      `<span class="score-bar" aria-hidden="true">` +
                      `<span class="score-bar-fill" style="width:${num * 10}%"></span>` +
                      `</span>`;
          } else {
            ddInner = escapeHtml(value);
          }
        } else {
          // Allow anchor tags in long values: keep value as escaped text,
          // but render trailing parenthetical notes verbatim.
          ddInner = escapeHtml(value);
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