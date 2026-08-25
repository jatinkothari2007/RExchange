import { z } from 'zod';

export const rateExchangeSchema = z.object({
  params: z.object({
    id: z.string().min(1), // exchange_id
  }),
  body: z.object({
    rating: z.number().int().min(1).max(5),
    feedback_tags: z.array(z.string().min(1).max(40)).min(1).max(6),
    comment: z.string().max(400).optional(),
  }),
});
