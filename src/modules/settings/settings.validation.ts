import { z } from 'zod';

export const updateSettingsSchema = z.object({
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  currency: z.string().min(1).optional(),
  language: z.string().min(1).optional(),
}).strict();

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
