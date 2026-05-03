// src/validators/deliveryNote.validator.js
import { z } from 'zod';

export const createDeliveryNoteSchema = z.object({
  clientId: z.string().length(24),
  projectId: z.string().length(24),
  format: z.enum(['hours', 'material']),
  description: z.string().min(1),
  workdate: z.string().datetime(),
  hours: z.number().positive().optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().optional(),
  unitPrice: z.number().positive().optional(),
});
