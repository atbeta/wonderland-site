// rehype plugin: wrap each `<h3>💥 #N — …</h3>` + adjacent
// `<dl class="spark-meta">…</dl>` in a `<section class="spark-card">`
// so the day page can style them as coherent cards.

import { visit, SKIP } from 'unist-util-visit';

// Match a raw <dl class="spark-meta">…</dl> html string in an mdast
// "raw" / rehype "raw" node. We only need to detect the tag, not parse it.
const RAW_DL_PATTERN = /^<dl class="spark-meta">/;

export default function rehypeSparkCard() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (!parent || index == null) return;
      if (node.tagName !== 'h3') return;

      // Skip leading whitespace text nodes.
      let cursor = index + 1;
      while (cursor < parent.children.length) {
        const n = parent.children[cursor];
        if (n.type === 'text' && /^\s*$/.test(n.value)) {
          cursor++;
          continue;
        }
        break;
      }
      const next = parent.children[cursor];
      if (!next) return;

      // Case 1: next is an actual rehype element <dl>.
      const isElementDl =
        next.type === 'element' &&
        next.tagName === 'dl' &&
        Array.isArray(next.properties?.className) &&
        next.properties.className.includes('spark-meta');

      // Case 2: next is a raw-html node holding the dl string we inserted
      // from the remark plugin. We treat it as the dl sibling.
      const isRawDl =
        next.type === 'raw' &&
        typeof next.value === 'string' &&
        RAW_DL_PATTERN.test(next.value.trimStart());

      if (!isElementDl && !isRawDl) return;

      // Splice out the (whitespace + dl) range and replace with a wrapping section.
      // spliceCount must include the dl node itself so we don't double-render it.
      const spliceCount = (cursor - index) + 1;
      parent.children.splice(index, spliceCount, {
        type: 'element',
        tagName: 'section',
        properties: { className: ['spark-card'] },
        children: [node, next],
      });

      return [SKIP, index + 1];
    });
  };
}