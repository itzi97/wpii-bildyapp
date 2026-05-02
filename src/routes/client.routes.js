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

router.get('/archived', listArchivedClients);
router.get('/', listClients);
router.get('/:id', getClient);
router.post('/', validate(createClientSchema), createClient);
router.put('/:id', validate(updateClientSchema), updateClient);
router.delete('/:id', deleteClient);
router.patch('/:id/restore', restoreClient);

export default router;
