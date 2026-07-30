import { defineConfig } from 'astro/config';
import remarkWonderlandSparkMeta from './remark-spark-meta.mjs';

export default defineConfig({
  site: 'https://wonderland.pbeta.dev',
  output: 'static',
  trailingSlash: 'ignore',
  experimental: {
    contentLayer: true,
  },
  markdown: {
    remarkPlugins: [remarkWonderlandSparkMeta],
  },
});