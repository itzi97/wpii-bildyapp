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
  refreshToken,
  uploadLogo,
  deleteUser,
  changePassword
} from '../controllers/user.controller.js';
import {
  registerSchema,
  emailValidationSchema,
  loginSchema,
  personalOnboardingSchema,
  companyOnboardingSchema,
  changePasswordSchema
} from '../validators/user.validator.js';
import validate from '../middleware/validate.js';
import { upload } from '../middleware/upload.js';

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

router.patch('/logo', authenticateToken, upload.single('logo'), uploadLogo);

router.get('/', authenticateToken, getCurrentUser);

router.post('/refresh', refreshToken);

router.post('/logout', authenticateToken, logout);

router.delete('/', authenticateToken, deleteUser);

router.put(
  '/password',
  authenticateToken,
  validate(changePasswordSchema),
  changePassword
);

router.post(
  '/invite',
  authenticateToken,
  authorizeRoles('admin'),
  validate(inviteUserSchema),
  inviteUser
);

export default router;
