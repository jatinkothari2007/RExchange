import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email().refine((val) => {
      const allowedDomain = process.env.ALLOWED_COLLEGE_DOMAIN || '@srmist.edu.in';
      return val.toLowerCase().endsWith(allowedDomain.toLowerCase());
    }, {
      message: `Email must belong to authorized college domain (${process.env.ALLOWED_COLLEGE_DOMAIN || '@srmist.edu.in'})`,
    }),
    name: z.string().min(2).max(60),
    department: z.string().min(2).max(100),
    year: z.number().int().min(1).max(5),
    hostel_block: z.string().min(2).max(100),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    email: z.string().email(),
    otp: z.string().length(6),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(60).optional(),
    department: z.string().min(2).max(100).optional(),
    year: z.number().int().min(1).max(5).optional(),
    hostel_block: z.string().min(2).max(100).optional(),
    avatar_url: z.string().url().optional(),
  }),
});
