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

router.get('/archived', listArchivedProjects);
router.get('/', listProjects);
router.get('/:id', getProject);
router.post('/', validate(createProjectSchema), createProject);
router.put('/:id', validate(updateProjectSchema), updateProject);
router.delete('/:id', deleteProject);
router.patch('/:id/restore', restoreProject);

export default router;
