// rehype plugin: wrap each `<h3>💥 #N — …</h3>`, the following
// `<div class="spark-meta">…</div>` nodes, and a trailing image-only
// paragraph in a `<section class="spark-card">` so the day page styles them
// as one coherent card (title → prose → bottom full-bleed illustration).
//
// A card's meta may arrive as several consecutive divs when the source
// paragraph was split by a blank line, and its illustration may sit in a
// paragraph of its own — all of them belong inside the section.

import { visit, SKIP } from 'unist-util-visit';

// Match raw html strings we inserted from the remark plugin. We only need
// to detect the tag, not parse it.
const RAW_META_PATTERN = /^<div class="spark-meta">/;
const RAW_FIGURE_PATTERN = /^<p class="spark-figure">/;

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

// A paragraph holding exactly one <img> — the card's illustration.
function isFigureParagraph(n) {
  if (!n) return false;
  if (
    n.type === 'raw' &&
    typeof n.value === 'string' &&
    RAW_FIGURE_PATTERN.test(n.value.trimStart())
  ) {
    return true;
  }
  if (n.type !== 'element' || n.tagName !== 'p') return false;
  const kids = n.children.filter((c) => !(c.type === 'text' && !/\S/.test(c.value)));
  return kids.length === 1 && kids[0].type === 'element' && kids[0].tagName === 'img';
}

export default function rehypeSparkCard() {
  return (tree) => {
    visit(tree, (node, index, parent) => {
      if (!parent || index == null) return;
      if (node.tagName !== 'h3') return;

      // Collect the h3 plus every consecutive meta div / figure paragraph
      // (whitespace text nodes in between are dropped with the splice).
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
        if (isFigureParagraph(n)) {
          if (n.type === 'element') {
            n.properties = { ...(n.properties || {}), className: ['spark-figure'] };
          }
          children.push(n);
          cursor++;
          end = cursor;
          continue;
        }
        break;
      }
      if (children.length < 2) return;

      // Splice the collected range and replace with the wrapping section.
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
