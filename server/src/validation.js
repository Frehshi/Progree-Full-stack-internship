import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.email().max(160).transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8).max(100)
});

export const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(80)
});

export const taskSchema = z.object({
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(500).default(''),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.iso.date(),
  status: z.enum(['not-started', 'in-progress', 'completed'])
});

export const taskPatchSchema = taskSchema.partial().refine((value) => Object.keys(value).length > 0, 'No changes supplied');

export const cartSchema = z.object({
  productId: z.string().min(1).max(80),
  quantity: z.number().int().min(0).max(20)
});

