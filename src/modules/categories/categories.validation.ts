import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  type: z.enum(['income', 'expense', 'both']),
  icon: z.string().max(100).optional(),
  color: z.string().max(20).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: z.enum(['income', 'expense', 'both']).optional(),
  icon: z.string().max(100).optional(),
  color: z.string().max(20).optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
