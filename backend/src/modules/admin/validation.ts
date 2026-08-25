import { z } from 'zod';

export const resolveDisputeSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    status: z.enum(['RESOLVED', 'DISMISSED']),
    resolution_notes: z.string().min(5).max(500),
    refund_karma_to: z.string().optional(),
    karma_amount: z.number().int().min(0).optional(),
  }),
});

export const banUserSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().min(3).max(300),
  }),
});
