import { Router } from 'express';
import { register } from '../controllers/user.controller.js';
import { registerSchema } from '../validators/user.validator.js';
import validate from '../middleware/validate.js';

const router = Router();

// TEST: Testing if route works.
router.post('/register', validate(registerSchema), register);

// TODO: Implement.
router.put('/validation', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// TODO: Implement.
router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// TODO: Implement.
router.put('/register/profile', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// TODO: Implement.
router.patch('/company', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// TODO: Implement.
router.patch('/logo', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// TODO: Implement.
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// TODO: Implement.
router.post('/refresh', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// TODO: Implement.
router.post('/logout', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// TODO: Implement.
router.delete('/', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// TODO: Implement.
router.put('/password', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// TODO: Implement.
router.post('/invite', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
