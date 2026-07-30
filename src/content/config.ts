import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const days = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './days' }),
  schema: z.object({
    title: z.string().optional(),
  }),
});

export const collections = { days };
