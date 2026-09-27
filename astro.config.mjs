import { defineConfig } from 'astro/config';
import remarkWonderlandSparkMeta from './remark-spark-meta.mjs';
import remarkDayStructure from './remark-day-structure.mjs';
import rehypeSparkCard from './rehype-spark-card.mjs';

export default defineConfig({
  site: 'https://wonderland.pbeta.dev',
  output: 'static',
  trailingSlash: 'ignore',
  experimental: { contentLayer: true },
  markdown: {
    remarkPlugins: [remarkDayStructure, remarkWonderlandSparkMeta],
    rehypePlugins: [rehypeSparkCard],
  },
});
