import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  register,
  validateEmail,
  login,
  getCurrentUser,
  logout,
  updatePersonalData,
  updateCompany,
  refreshToken
} from '../controllers/user.controller.js';
import {
  registerSchema,
  emailValidationSchema,
  loginSchema,
  personalOnboardingSchema,
  companyOnboardingSchema
} from '../validators/user.validator.js';
import validate from '../middleware/validate.js';

const router = Router();

router.post('/register', validate(registerSchema), register);

router.put(
  '/validation',
  authenticateToken,
  validate(emailValidationSchema),
  validateEmail
);

router.post('/login', validate(loginSchema), login);

router.put(
  '/register',
  authenticateToken,
  validate(personalOnboardingSchema),
  updatePersonalData
);

router.patch(
  '/company',
  authenticateToken,
  validate(companyOnboardingSchema),
  updateCompany
);

// TODO: Implement.
router.patch('/logo', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

// TODO: Implement.
router.get('/', authenticateToken, getCurrentUser);

// TEST: In process of being tested
router.post('/refresh', refreshToken);

// TODO: Implement.
router.post('/logout', authenticateToken, logout);

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
