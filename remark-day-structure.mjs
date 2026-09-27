// remark plugin: day-level structural cleanup of the archive body.
//
// 1) Drop the "本期约束" blockquote — the day page TOC already lists every
//    group together with its constraint, so the blockquote is a third repeat.
// 2) Fold the "速览（30 秒）" section into a <details> block: a summary for
//    returning readers, not something every reader needs expanded.
// 3) Drop empty "## 火花板" headings left over from the archive template.
// 4) Drop the trailing "## 元数据" section (search queries, 族分布统计,
//    本期回顾): generation workflow, not reader content. It is the last h2
//    of every archive file, so everything from that heading on goes away.

function textOf(node) {
  if (!node) return '';
  if (node.type === 'text' || node.type === 'inlineCode') return node.value;
  if (Array.isArray(node.children)) return node.children.map(textOf).join('');
  return '';
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default function remarkDayStructure() {
  return (tree) => {
    if (!Array.isArray(tree.children)) return;

    // 1) The day-level 本期约束 blockquote (连接点分析 blockquotes stay).
    const bq = tree.children.findIndex(
      (n) => n.type === 'blockquote' && textOf(n).includes('本期约束')
    );
    if (bq !== -1) tree.children.splice(bq, 1);

    // 2) Fold 速览 into <details>, keeping everything up to the next h2.
    const hIdx = tree.children.findIndex(
      (n) => n.type === 'heading' && n.depth === 2 && /速览/.test(textOf(n))
    );
    if (hIdx !== -1) {
      let end = tree.children.length;
      for (let i = hIdx + 1; i < tree.children.length; i++) {
        const n = tree.children[i];
        if (n.type === 'heading' && n.depth <= 2) {
          end = i;
          break;
        }
      }
      const summaryText = textOf(tree.children[hIdx]).trim() || '速览';
      tree.children = [
        ...tree.children.slice(0, hIdx),
        {
          type: 'html',
          value: `<details class="day-summary"><summary>${escapeHtml(summaryText)}</summary>`,
        },
        ...tree.children.slice(hIdx + 1, end),
        { type: 'html', value: '</details>' },
        ...tree.children.slice(end),
      ];
    }

    // 3) 火花板 headings carry no content before the next heading — drop them.
    for (let i = tree.children.length - 1; i >= 0; i--) {
      const n = tree.children[i];
      if (n.type !== 'heading' || n.depth !== 2 || textOf(n).trim() !== '火花板') continue;
      let empty = true;
      for (let j = i + 1; j < tree.children.length; j++) {
        const c = tree.children[j];
        if (c.type === 'heading' && c.depth <= 2) break;
        if (c.type === 'thematicBreak') continue;
        if (c.type === 'html' && !/\S/.test(String(c.value).replace(/<[^>]*>/g, ''))) continue;
        empty = false;
        break;
      }
      if (empty) tree.children.splice(i, 1);
    }

    // 4) Truncate from the trailing 元数据 heading on.
    const metaIdx = tree.children.findIndex(
      (n) => n.type === 'heading' && n.depth === 2 && textOf(n).trim() === '元数据'
    );
    if (metaIdx !== -1) tree.children.length = metaIdx;
  };
}
