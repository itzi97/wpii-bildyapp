// src/validators/deliverynote.validator.js
import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

const workerSchema = z.object({
  name: z.string().trim().min(1),
  hours: z.number().positive(),
});

const materialSchema = z.object({
  material: z.string().trim().min(1),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1),
});

export const createDeliveryNoteSchema = z.object({
  body: z.object({
    clientId: objectId,
    projectId: objectId,
    format: z.enum(['hours', 'material']),
    description: z.string().trim().min(1).optional(),
    workDate: z.coerce.date(),
    hours: z.number().positive().optional(),
    workers: z.array(workerSchema).optional(),
    materials: z.array(materialSchema).optional(),
  }).superRefine((data, ctx) => {
    if (data.format === 'hours' && !data.hours && (!data.workers || data.workers.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Hours format requires hours or workers',
        path: ['hours'],
      });
    }

    if (data.format === 'material' && (!data.materials || data.materials.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Material format requires at least one material entry',
        path: ['materials'],
      });
    }
  }),
});

export const deliveryNoteIdSchema = z.object({
  params: z.object({
    id: objectId,
  }),
});

export const signDeliveryNoteSchema = z.object({
  body: z.object({
    signatureData: z.string().min(1, 'signatureData is required'),
  }),
});
