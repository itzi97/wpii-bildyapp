import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js'
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

router.post('/', createDeliveryNote);
router.get('/', getDeliveryNotes);
router.get('/pdf/:id', getDeliveryNotePDF);
router.get('/:id', getDeliveryNote);
router.put('/sign/:id', signDeliveryNote);
router.delete('/:id', deleteDeliveryNote);

export default router;
