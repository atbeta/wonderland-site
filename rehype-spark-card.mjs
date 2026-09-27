// rehype plugin: wrap each `<h3>💥 #N — …</h3>` + the following
// `<div class="spark-meta">…</div>` nodes in a `<section class="spark-card">`
// so the day page can style them as coherent cards. A card's meta may arrive
// as several consecutive divs when the source paragraph was split by a blank
// line — all of them belong inside the section.

import { visit, SKIP } from 'unist-util-visit';

// Match a raw <div class="spark-meta">…</div> html string in an mdast
// "raw" / rehype "raw" node. We only need to detect the tag, not parse it.
const RAW_META_PATTERN = /^<div class="spark-meta">/;

const isWhitespace = (n) => n.type === 'text' && /^\s*$/.test(n.value);

function isMetaDiv(n) {
  if (!n) return false;
  if (
    n.type === 'element' &&
    n.tagName === 'div' &&
    Array.isArray(n.properties?.className) &&
    n.properties.className.includes('spark-meta')
  ) {
    return true;
  }
  return (
    n.type === 'raw' &&
    typeof n.value === 'string' &&
    RAW_META_PATTERN.test(n.value.trimStart())
  );
}

export default function rehypeSparkCard() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (!parent || index == null) return;
      if (node.tagName !== 'h3') return;

      // Collect every consecutive spark-meta div after the h3 (whitespace
      // text nodes in between are dropped with the splice).
      const children = [node];
      let cursor = index + 1;
      let end = index + 1;
      while (cursor < parent.children.length) {
        const n = parent.children[cursor];
        if (isWhitespace(n)) {
          cursor++;
          continue;
        }
        if (isMetaDiv(n)) {
          children.push(n);
          cursor++;
          end = cursor;
          continue;
        }
        break;
      }
      if (children.length < 2) return;

      // Splice the h3 + meta range and replace with the wrapping section.
      parent.children.splice(index, end - index, {
        type: 'element',
        tagName: 'section',
        properties: { className: ['spark-card'] },
        children,
      });

      return [SKIP, index + 1];
    });
  };
}
