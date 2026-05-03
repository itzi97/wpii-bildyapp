// src/routes/project.routes.js
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema
} from '../validators/project.validator.js';
import {
  createProject,
  updateProject,
  listProjects,
  getProject,
  deleteProject,
  listArchivedProjects,
  restoreProject,
} from '../controllers/project.controller.js';

const router = Router();

router.use(authenticateToken);

/**
 * @swagger
 * /api/project/archived:
 *   get:
 *     summary: List soft-deleted (archived) projects
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of archived projects
 *       401:
 *         description: Unauthorized
 */
router.get('/archived', listArchivedProjects);

/**
 * @swagger
 * /api/project:
 *   get:
 *     summary: List all active projects
 *     tags: [Projects]
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
 *         name: clientId
 *         schema: { type: string }
 *       - in: query
 *         name: active
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of projects
 *       401:
 *         description: Unauthorized
 */
router.get('/', listProjects);

/**
 * @swagger
 * /api/project/{id}:
 *   get:
 *     summary: Get a specific project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       404:
 *         description: Not found
 */
router.get('/:id', getProject);

/**
 * @swagger
 * /api/project:
 *   post:
 *     summary: Create a project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, projectCode, clientId]
 *             properties:
 *               name:        { type: string }
 *               projectCode: { type: string }
 *               clientId:    { type: string }
 *               active:      { type: boolean, default: true }
 *     responses:
 *       201:
 *         description: Project created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error
 */
router.post('/', validate(createProjectSchema), createProject);

/**
 * @swagger
 * /api/project/{id}:
 *   put:
 *     summary: Update a project
 *     tags: [Projects]
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
 *             $ref: '#/components/schemas/Project'
 *     responses:
 *       200:
 *         description: Project updated
 *       404:
 *         description: Not found
 */
router.put('/:id', validate(updateProjectSchema), updateProject);

/**
 * @swagger
 * /api/project/{id}:
 *   delete:
 *     summary: Soft or hard delete a project
 *     tags: [Projects]
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
 *         description: If true, permanently deletes the project
 *     responses:
 *       200:
 *         description: Deleted
 *       404:
 *         description: Not found
 */
router.delete('/:id', deleteProject);

/**
 * @swagger
 * /api/project/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project restored
 *       404:
 *         description: Not found
 */
router.patch('/:id/restore', restoreProject);

export default router;
