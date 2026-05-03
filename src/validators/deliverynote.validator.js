// src/validators/deliveryNote.validator.js
import { z } from 'zod';

const workerSchema = z.object({
  name: z.string().min(1),
  hours: z.number().positive(),
});

const materialSchema = z.object({
  material: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
});

export const createDeliveryNoteSchema = z.object({
  clientId: z.string().length(24),
  projectId: z.string().length(24),
  format: z.enum(['hours', 'material']),
  description: z.string().min(1).optional(),
  workdate: z.string().datetime(),
  // format === 'hours'
  hours: z.number().positive().optional(),
  workers: z.array(workerSchema).optional(),
  // format === 'material'
  materials: z.array(materialSchema).optional(),
});
