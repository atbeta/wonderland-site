import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://wonderland.pbeta.dev',
  output: 'static',
  trailingSlash: 'ignore',
  experimental: {
    contentLayer: true,
  },
});
