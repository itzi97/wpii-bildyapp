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

// All delivery note routes require a valid JWT
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
 *         description: Delivery note created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryNote'
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
 *     summary: List all delivery notes for the authenticated user's company
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
 *         description: Filter by project ID
 *       - in: query
 *         name: client
 *         schema:
 *           type: string
 *         description: Filter by client ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [hours, material]
 *       - in: query
 *         name: signed
 *         schema:
 *           type: boolean
 *         description: Filter by signed status
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter notes from this date (inclusive)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter notes up to this date (inclusive)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           example: -workDate
 *         description: Sort field, prefix with '-' for descending
 *     responses:
 *       200:
 *         description: List of delivery notes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DeliveryNote'
 *       401:
 *         description: Unauthorized
 */
router.get('/', getDeliveryNotes);

/**
 * @swagger
 * /api/deliverynote/pdf/{id}:
 *   get:
 *     summary: Download a delivery note as a PDF file
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery note ID
 *     responses:
 *       200:
 *         description: PDF file stream
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Delivery note not found
 */
router.get('/pdf/:id', validate(deliveryNoteIdSchema), getDeliveryNotePDF);

/**
 * @swagger
 * /api/deliverynote/{id}:
 *   get:
 *     summary: Get a specific delivery note by ID
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery note ID
 *     responses:
 *       200:
 *         description: Delivery note found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Delivery note not found
 */
router.get('/:id', validate(deliveryNoteIdSchema), getDeliveryNote);

/**
 * @swagger
 * /api/deliverynote/{id}/sign:
 *   patch:
 *     summary: Sign a delivery note with a signature image
 *     description: Once signed, a delivery note cannot be modified or deleted.
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery note ID
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
 *                 description: Signature image (jpeg, jpg, png, or webp)
 *     responses:
 *       200:
 *         description: Delivery note signed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DeliveryNote'
 *       400:
 *         description: No signature file provided
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Delivery note not found
 *       409:
 *         description: Delivery note is already signed
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
 *     description: Signed delivery notes cannot be deleted.
 *     tags: [DeliveryNotes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Delivery note ID
 *     responses:
 *       200:
 *         description: Delivery note deleted
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Delivery note deleted
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Cannot delete a signed delivery note
 *       404:
 *         description: Delivery note not found
 */
router.delete('/:id', validate(deliveryNoteIdSchema), deleteDeliveryNote);

export default router;
