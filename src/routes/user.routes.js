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
 *     summary: Register a new user account
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@bildyapp.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Password123!
 *     responses:
 *       201:
 *         description: User registered, returns access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       400:
 *         description: Validation error or email already in use
 */
router.post('/register', validate(registerSchema), register);

/**
 * @swagger
 * /api/user/validation:
 *   put:
 *     summary: Validate email address with OTP code
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
 *               code:
 *                 type: string
 *                 example: "482910"
 *     responses:
 *       200:
 *         description: Email validated successfully
 *       400:
 *         description: Invalid or expired OTP code
 *       401:
 *         description: Unauthorized
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
 *     summary: Login and receive a JWT access token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid email or password
 */
router.post('/login', validate(loginSchema), login);

/**
 * @swagger
 * /api/user/register:
 *   put:
 *     summary: Complete personal onboarding (name, NIF, etc.)
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
 *               name:
 *                 type: string
 *                 example: Ana
 *               lastName:
 *                 type: string
 *                 example: García
 *               nif:
 *                 type: string
 *                 example: 12345678A
 *     responses:
 *       200:
 *         description: Personal data updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
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
 *     summary: Set or update the authenticated user's company data
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
 *               name:
 *                 type: string
 *                 example: Bildy SL
 *               cif:
 *                 type: string
 *                 example: B12345678
 *               isFreelance:
 *                 type: boolean
 *                 example: false
 *               address:
 *                 type: string
 *                 example: Calle Mayor 1, Madrid
 *     responses:
 *       200:
 *         description: Company data updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Company'
 *       401:
 *         description: Unauthorized
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
 *     summary: Upload company logo image
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [logo]
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Logo image (jpeg, jpg, png, or webp, max 5MB)
 *     responses:
 *       200:
 *         description: Logo uploaded and URL saved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 logoUrl:
 *                   type: string
 *                   example: https://res.cloudinary.com/demo/image/upload/logo.png
 *       400:
 *         description: No file provided or invalid file type
 *       401:
 *         description: Unauthorized
 */
router.patch('/logo', authenticateToken, uploadMemory.single('logo'), uploadLogo);

/**
 * @swagger
 * /api/user:
 *   get:
 *     summary: Get the current authenticated user's profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, getCurrentUser);

/**
 * @swagger
 * /api/user/refresh:
 *   post:
 *     summary: Obtain a new access token using a refresh token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New access token issued
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: Logout the current user (invalidates refresh token)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticateToken, logout);

/**
 * @swagger
 * /api/user:
 *   delete:
 *     summary: Soft-delete the current user account
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User account deleted
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
 *                   example: User deleted
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
 *     summary: Change the current user's password
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
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
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
 *     summary: Invite a user to join the company (admin only)
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
 *               email:
 *                 type: string
 *                 format: email
 *                 example: newcolleague@bildyapp.com
 *     responses:
 *       200:
 *         description: Invitation email sent
 *       401:
 *         description: Unauthorized
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
