# Charter Cost Guide

Independent yacht and private jet charter cost guides. Static site built with
[Astro](https://astro.build), deployed on Cloudflare Pages.

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build   # runs scripts/gen-redirects.mjs, then astro build -> dist/
```

## Deploy (Cloudflare Pages)

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `NODE_VERSION=20`

## Conventions

- All owner-specific values live in `src/config.ts`. Empty values degrade
  gracefully (no raw placeholders are ever rendered).
- Affiliate programs live in `src/data/programs.ts`. Status `pending` (default)
  never renders a commercial link; `scripts/gen-redirects.mjs` writes
  `public/_redirects` for approved programs only.
- Articles are MDX in `src/content/guides/` following the schema in
  `src/content/config.ts`. Only link to pages that are already published.
- One primary affiliate CTA per page max. Never invent prices, people,
  testimonials or program terms.
