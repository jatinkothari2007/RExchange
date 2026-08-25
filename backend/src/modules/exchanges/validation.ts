import { z } from 'zod';

export const createExchangeSchema = z.object({
  body: z.object({
    listing_id: z.string().min(1),
    agreed_karma: z.number().int().min(5).optional(),
    notes: z.string().max(500).optional(),
  }),
});

export const cancelExchangeSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().min(3).max(300),
  }),
});

export const disputeExchangeSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().min(5).max(500),
  }),
});
