import { z } from 'zod';

export const createListingSchema = z.object({
  body: z.object({
    type: z.enum(['ITEM', 'NOTE', 'TICKET', 'SKILL', 'OPPORTUNITY']),
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().min(1, 'Description is required').max(5000),
    category: z.string().min(1, 'Category is required').max(100),
    tags: z.array(z.string()).optional(),
    karma_value: z.number().min(1).max(1000).optional(),
    pickup_point: z.string().min(1, 'Pickup point is required').max(200),
    image_url: z.string().optional(),
    expires_in_days: z.number().optional(),

    // Item fields
    condition: z.string().optional(),
    original_price_est: z.number().optional(),

    // Note fields
    subject: z.string().optional(),
    semester: z.number().optional(),
    file_url: z.string().optional(),
    page_count: z.number().optional(),

    // Ticket fields
    event_name: z.string().optional(),
    event_date: z.string().optional(),
    venue: z.string().optional(),

    // Skill fields
    skill_category: z.string().optional(),
    duration_minutes: z.number().optional(),
    session_mode: z.string().optional(),
    voice_note_url: z.string().optional(),

    // Opportunity fields
    organization: z.string().optional(),
    role_title: z.string().optional(),
    application_deadline: z.string().optional(),
  }),
});

export const updateListingSchema = z.object({
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    title: z.string().min(3).max(120).optional(),
    description: z.string().min(10).max(2000).optional(),
    category: z.string().min(2).max(80).optional(),
    tags: z.array(z.string()).optional(),
    karma_value: z.number().int().min(5).max(500).optional(),
    pickup_point: z.string().min(3).max(150).optional(),
    image_url: z.string().url().optional(),
    status: z.enum(['available', 'pending', 'exchanged', 'expired']).optional(),
  }),
});

export const suggestKarmaSchema = z.object({
  body: z.object({
    type: z.enum(['ITEM', 'NOTE', 'TICKET', 'SKILL', 'OPPORTUNITY']),
    category: z.string().optional(),
    condition: z.enum(['like_new', 'good', 'fair']).optional(),
    original_price_est: z.number().optional(),
    duration_minutes: z.number().optional(),
    page_count: z.number().optional(),
    tags: z.array(z.string()).optional(),
  }),
});
