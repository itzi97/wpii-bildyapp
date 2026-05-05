// src/routes/deliverynote.routes.js
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import validate from '../middleware/validate.js';
import { uploadMemory } from '../middleware/upload.js';
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNote,
  signDeliveryNote,
  getDeliveryNotePDF,
  deleteDeliveryNote,
} from '../controllers/deliverynote.controller.js';
import {
  createDeliveryNoteSchema,
  deliveryNoteIdSchema,
} from '../validators/deliverynote.validator.js';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /api/deliverynote:
 *   post:
 *     summary: Create a delivery note
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [clientId, projectId, format, workDate]
 *             properties:
 *               clientId:
 *                 type: string
 *                 example: 6818a5f0c1234567890abcde
 *               projectId:
 *                 type: string
 *                 example: 6818a5f0c1234567890abcdf
 *               format:
 *                 type: string
 *                 enum: [hours, material]
 *               description:
 *                 type: string
 *                 example: Electrical installation work
 *               workDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2026-05-05T08:00:00.000Z
 *               hours:
 *                 type: number
 *                 example: 8
 *               workers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Juan Pérez
 *                     hours:
 *                       type: number
 *                       example: 4
 *               materials:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     material:
 *                       type: string
 *                       example: Cement
 *                     quantity:
 *                       type: number
 *                       example: 10
 *                     unit:
 *                       type: string
 *                       example: bags
 *     responses:
 *       201:
 *         description: Delivery note created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', validate(createDeliveryNoteSchema), createDeliveryNote);

/**
 * @swagger
 * /api/deliverynote:
 *   get:
 *     summary: List all delivery notes
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: project
 *         schema:
 *           type: string
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [hours, material]
 *       - in: query
 *         name: signed
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: -workDate
 *     responses:
 *       200:
 *         description: List of delivery notes
 *       401:
 *         description: Unauthorized
 */
router.get('/', getDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     summary: Download delivery note as PDF
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: PDF file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Not found
 */
router.get('/pdf/:id', validate(deliveryNoteIdSchema), getDeliveryNotePDF);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     summary: Get a specific delivery note
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Delivery note found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DeliveryNote'
 *       404:
 *         description: Not found
 */
router.get('/:id', validate(deliveryNoteIdSchema), getDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     summary: Sign a delivery note
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [signature]
 *             properties:
 *               signature:
 *                 type: string
 *                 format: binary
 *                 description: Signature image file
 *     responses:
 *       200:
 *         description: Delivery note signed
 *       409:
 *         description: Already signed
 *       404:
 *         description: Not found
 */
router.patch(
  '/:id/sign',
  validate(deliveryNoteIdSchema),
  uploadMemory.single('signature'),
  signDeliveryNote
);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   delete:
 *     summary: Delete a delivery note
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         description: Cannot delete a signed note
 *       404:
 *         description: Not found
 */
router.delete('/:id', validate(deliveryNoteIdSchema), deleteDeliveryNote);

export default router;
