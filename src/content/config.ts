import { defineCollection, z } from 'astro:content';

const guides = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    seoTitle: z.string().max(39).optional(),
    description: z.string().max(155),
    hub: z.enum(['yacht-charter', 'private-jets', 'planning']),
    urlSlug: z.string(),
    published: z.date(),
    updated: z.date(),
    dataAsOf: z.date(),
    heroImage: z.string().optional(),
    heroAlt: z.string().optional(),
    shortAnswer: z.string().max(480),
    primaryProgram: z.string().optional(),
    related: z.array(z.string()).default([]),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).default([]),
    sources: z.array(z.object({ name: z.string(), url: z.string().url(), accessed: z.string() })).default([]),
    feedback: z.boolean().optional(),
  }),
});

export const collections = { guides };
