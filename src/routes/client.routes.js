// src/routes/client.routes.js
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import { createClientSchema, updateClientSchema } from '../validators/client.validator.js';
import {
  createClient,
  updateClient,
  listClients,
  getClient,
  deleteClient,
  listArchivedClients,
  restoreClient,
} from '../controllers/client.controller.js';

const router = Router();

// All clients routes require JWT
router.use(authenticateToken);

/**
 * @swagger
 * /api/client/archived:
 *   get:
 *     summary: List soft-deleted (archived) clients
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of archived clients
 *       401:
 *         description: Unauthorized
 */
router.get('/archived', listArchivedClients);

/**
 * @swagger
 * /api/client:
 *   get:
 *     summary: List all active clients
 *     tags: [Clients]
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
 *         name: name
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of clients
 *       401:
 *         description: Unauthorized
 */
router.get('/', listClients);

/**
 * @swagger
 * /api/client/{id}:
 *   get:
 *     summary: Get a specific client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       404:
 *         description: Not found
 */
router.get('/:id', getClient);

/**
 * @swagger
 * /api/client:
 *   post:
 *     summary: Create a client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif, email]
 *             properties:
 *               name:    { type: string }
 *               cif:     { type: string }
 *               email:   { type: string, format: email }
 *               phone:   { type: string }
 *               address: { type: string }
 *     responses:
 *       201:
 *         description: Client created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Client'
 *       400:
 *         description: Validation error
 */
router.post('/', validate(createClientSchema), createClient);

/**
 * @swagger
 * /api/client/{id}:
 *   put:
 *     summary: Update a client
 *     tags: [Clients]
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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Client'
 *     responses:
 *       200:
 *         description: Client updated
 *       404:
 *         description: Not found
 */
router.put('/:id', validate(updateClientSchema), updateClient);

/**
 * @swagger
 * /api/client/{id}:
 *   delete:
 *     summary: Soft or hard delete a client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: hard
 *         schema: { type: boolean, default: false }
 *         description: If true, permanently deletes the client
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', deleteClient);

/**
 * @swagger
 * /api/client/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted client
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Client restored
 *       404:
 *         description: Not found
 */
router.patch('/:id/restore', restoreClient);


export default router;
