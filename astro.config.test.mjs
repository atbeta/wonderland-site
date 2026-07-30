import { defineConfig } from 'astro/config';
import remarkWonderlandSparkMeta from './remark-spark-meta.mjs';
import rehypeSparkCard from './rehype-spark-card.mjs';
import dumpRehype from '/tmp/dump-rehype.mjs';

export default defineConfig({
  site: 'https://wonderland.pbeta.dev',
  output: 'static',
  trailingSlash: 'ignore',
  experimental: { contentLayer: true },
  markdown: {
    remarkPlugins: [remarkWonderlandSparkMeta],
    rehypePlugins: [dumpRehype, rehypeSparkCard],
  },
});
