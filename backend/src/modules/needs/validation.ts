import { z } from 'zod';

export const createNeedSchema = z.object({
  body: z.object({
    title: z.string().min(5).max(140),
    description: z.string().min(10).max(1000),
    category: z.string().min(2).max(80),
    tags: z.array(z.string().min(1).max(30)).min(1).max(10),
    max_karma_offered: z.number().int().min(10).max(300),
    target_deadline: z.string().datetime(),
    hostel_block: z.string().min(2).max(100),
  }),
});

export const fulfillNeedSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    offering_listing_id: z.string().optional(),
    notes: z.string().max(300).optional(),
  }),
});
