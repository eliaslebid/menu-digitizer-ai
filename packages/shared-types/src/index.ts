import { z } from 'zod';

export const MenuItemSchema = z.object({
  name: z.string(),
  price: z.number(),
  description: z.string().optional(),
  raw_text: z.string().optional(),
});

export type MenuItem = z.infer<typeof MenuItemSchema>;

export const ClassificationSchema = z.object({
  is_vegetarian: z.boolean(),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
  flags: z.array(z.string()).default([]),
});

export type Classification = z.infer<typeof ClassificationSchema>;

export const ClassifiedMenuItemSchema = MenuItemSchema.extend({
  classification: ClassificationSchema.optional(),
});

export type ClassifiedMenuItem = z.infer<typeof ClassifiedMenuItemSchema>;

export const UncertaintyCardSchema = z.object({
  flagged_items: z.array(z.record(z.any())),
  requires_review: z.boolean().default(true),
});

export type UncertaintyCard = z.infer<typeof UncertaintyCardSchema>;

export const MenuProcessingResultSchema = z.object({
  vegetarian_items: z.array(ClassifiedMenuItemSchema),
  total_sum: z.number(),
  uncertainty_card: UncertaintyCardSchema.optional(),
  request_id: z.string(),
});

export type MenuProcessingResult = z.infer<typeof MenuProcessingResultSchema>;
