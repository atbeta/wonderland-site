import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Phase 2: the archive's YAML frontmatter is now the site's contract.
// Facts come from frontmatter (validated here at build time); the markdown
// body stays the prose that gets rendered. A malformed night fails the build
// instead of silently rendering zero cards.
const sparkCard = z.object({
  n: z.number().int().positive(),
  title: z.string(),
  group: z.string().nullable().optional(),
  family: z.string().nullable().optional(),
  surprise: z.number().nullable().optional(),
  image: z.string().url().nullable().optional(),
});

const collisionGroup = z.object({
  id: z.string(),
  a: z.string(),
  b: z.string(),
  constraint: z.string().default(''),
});

const days = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './days' }),
  schema: z.object({
    schema: z.literal('wonderland-archive/v1'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    title: z.string().optional(),
    constraints: z.array(z.string()).default([]),
    groups: z.array(collisionGroup).default([]),
    cards: z.array(sparkCard).min(1),
    card_count: z.number().optional(),
    image_count: z.number().optional(),
  }),
});

export const collections = { days };
