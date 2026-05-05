// src/routes/deliverynote.routes.js
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { uploadMemory } from '../middleware/upload.js';
import {
  createDeliveryNote,
  getDeliveryNotes,
  getDeliveryNote,
  signDeliveryNote,
  getDeliveryNotePDF,
  deleteDeliveryNote,
} from '../controllers/deliverynote.controller.js';

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
 *             required: [clientId, projectId, format, workdate]
 *             properties:
 *               clientId:    { type: string }
 *               projectId:   { type: string }
 *               format:      { type: string, enum: [hours, material] }
 *               description: { type: string }
 *               workdate:    { type: string, format: date-time }
 *               hours:       { type: number }
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
router.post('/', authenticateToken, createDeliveryNote);

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
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: format
 *         schema: { type: string, enum: [hours, material] }
 *       - in: query
 *         name: signed
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of delivery notes
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, getDeliveryNotes);

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
 *         schema: { type: string }
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
router.get('/pdf/:id', authenticateToken, getDeliveryNotePDF);

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
 *         schema: { type: string }
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
router.get('/:id', authenticateToken, getDeliveryNote);

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
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [signatureData]
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
router.patch('/:id/sign', authenticateToken, uploadMemory.single('signature'), signDeliveryNote);

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
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 *       403:
 *         description: Cannot delete a signed note
 *       404:
 *         description: Not found
 */
router.delete('/:id', authenticateToken, deleteDeliveryNote);

export default router;
