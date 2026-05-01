import { defineCollection, z } from 'astro:content';

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(20).max(100),
    beat: z.enum([
      'business',
      'finance',
      'entertainment',
      'lifestyle',
      'health',
      'travel',
      'international',
      'sports',
      'astro',
    ]),
    publishedAt: z.coerce.date(),
    author: z.object({
      name: z.string(),
      slug: z.string(),
    }),
    sources: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        url: z.string().url(),
        language: z.string(),
      }),
    ),
    image: z.object({
      path: z.string(),
      alt: z.string(),
      photographer: z.string(),
      source: z.enum(['pexels', 'unsplash', 'fallback']),
      sourceUrl: z.string().url().optional(),
    }),
    metaDescription: z.string().min(120).max(170),
    tags: z.array(z.string()).min(1).max(8),
    wordCount: z.number().int().min(500).max(2000),
    auditScore: z.number().int().min(0).max(10),
    runId: z.string(),
  }),
});

export const collections = { articles };
