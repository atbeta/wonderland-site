# PicFast Site

Official website and documentation for [PicFast](https://github.com/atbeta/picfast) — open source, self-hosted image hosting.

## Tech

Built with [Astro](https://astro.build) (static output), TypeScript, and vanilla CSS with dark mode support.

## Develop

```bash
pnpm install
pnpm dev      # local dev server
pnpm build    # production build
pnpm preview  # preview production build
```

## Structure

```
src/
├── layouts/         # BaseLayout (homepage) + DocsLayout (docs)
├── pages/
│   ├── index.astro           # Homepage (EN)
│   ├── zh/index.astro       # Homepage (ZH)
│   └── docs/                # EN docs
│   └── zh/docs/             # ZH docs
└── public/                   # Static assets
```

## Deploy

Vercel, Cloudflare Pages, Netlify, or any static host.

```bash
pnpm build
```

Output goes to `dist/`.
