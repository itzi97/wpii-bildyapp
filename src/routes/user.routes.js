import { Router } from 'express';
import { register, login, validateEmail } from '../controllers/user.controller.js';
import { registerSchema, loginSchema, emailValidationSchema } from '../validators/user.validator.js';
import validate from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), register);

router.put(
  '/validation',
  authenticateToken,
  validate(emailValidationSchema),
  validateEmail
);

router.post('/login', validate(loginSchema), login);

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
