// src/routes/user.routes.js
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { authorizeRoles } from '../middleware/role.middleware.js';
import { uploadMemory } from '../middleware/upload.js';
import { validate } from '../middleware/validate.js';
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
  changePassword,
  inviteUser
} from '../controllers/user.controller.js';
import {
  registerSchema,
  emailValidationSchema,
  loginSchema,
  personalOnboardingSchema,
  companyOnboardingSchema,
  refreshTokenSchema,
  changePasswordSchema,
  inviteUserSchema,
  deleteUserSchema
} from '../validators/user.validator.js';

const router = Router();

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *     responses:
 *       201:
 *         description: User registered
 *       400:
 *         description: Validation error
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     summary: Validate email with OTP code
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code: { type: string }
 *     responses:
 *       200:
 *         description: Email validated
 *       400:
 *         description: Invalid or expired code
 */
router.put(
  '/validation',
  authenticateToken,
  validate(emailValidationSchema),
  validateEmail
);

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: Login and receive JWT
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:    { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful, returns token
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /api/user/register:
 *   put:
 *     summary: Complete personal onboarding data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string }
 *               phone:    { type: string }
 *               address:  { type: string }
 *     responses:
 *       200:
 *         description: Personal data updated
 *       401:
 *         description: Unauthorized
 */
router.put(
  '/register',
  authenticateToken,
  validate(personalOnboardingSchema),
  updatePersonalData
);

/**
 * @swagger
 * /api/user/company:
 *   patch:
 *     summary: Set or update company data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, cif]
 *             properties:
 *               name:        { type: string }
 *               cif:         { type: string }
 *               isFreelance: { type: boolean }
 *               address:     { type: string }
 *     responses:
 *       200:
 *         description: Company updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Company'
 */
router.patch(
  '/company',
  authenticateToken,
  validate(companyOnboardingSchema),
  updateCompany
);

/**
 * @swagger
 * /api/user/logo:
 *   patch:
 *     summary: Upload company logo
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Logo uploaded
 *       400:
 *         description: No file provided
 */
router.patch('/logo', authenticateToken, uploadMemory.single('logo'), uploadLogo);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, getCurrentUser);

/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New token issued
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Logout current user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/logout', authenticateToken, logout);

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Delete current user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User deleted
 *       401:
 *         description: Unauthorized
 */
router.delete(
  '/',
  authenticateToken,
  validate(deleteUserSchema),
  deleteUser
);

/**
 * @swagger
 * /api/user/password:
 *   put:
 *     summary: Change password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword: { type: string }
 *               newPassword:     { type: string, minLength: 8 }
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         description: Wrong current password
 */
router.put(
  '/password',
  authenticateToken,
  validate(changePasswordSchema),
  changePassword
);

/**
 * @swagger
 * /api/user/invite:
 *   post:
 *     summary: Invite a user to the company (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, format: email }
 *     responses:
 *       200:
 *         description: Invitation sent
 *       403:
 *         description: Admin role required
 */
router.post(
  '/invite',
  authenticateToken,
  authorizeRoles('admin'),
  validate(inviteUserSchema),
  inviteUser
);

export default router;
