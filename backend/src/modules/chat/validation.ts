import { z } from 'zod';

export const sendMessageSchema = z.object({
  params: z.object({
    id: z.string().min(1), // exchange_id
  }),
  body: z.object({
    type: z.enum(['text', 'propose_karma']).default('text'),
    content: z.string().min(1).max(1000),
    proposed_karma: z.number().int().min(5).max(500).optional(),
  }),
});

export const respondProposalSchema = z.object({
  params: z.object({
    id: z.string().min(1), // exchange_id
    msgId: z.string().min(1),
  }),
  body: z.object({
    action: z.enum(['accept', 'reject']),
  }),
});
