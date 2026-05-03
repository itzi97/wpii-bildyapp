// src/controllers/project.controller.js
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';

// POST /api/project
export const createProject = async (req, res, next) => {
  try {
    const { id: userId } = req.user;
    const company = req.user.company._id;

    // Verify client belongs to the same company
    const client = await Client.findOne({
      _id: req.body.client,
      company,
      deleted: false
    });

    if (!client)
      return next(AppError.notFound('Client not found in your company'));

    const existing = await Project.findOne({
      company,
      projectCode: req.body.projectCode.toUpperCase()
    });

    if (existing)
      return next(AppError.conflict('A project with this code already exists in your company'));

    const project = await Project.create({
      ...req.body,
      user: userId,
      company
    });

    req.app.get('io')?.to(company.toString()).emit('project:new', project);

    res.status(201).json({ ok: true, project });
  } catch (err) {
    next(err);
  }
}

// PUT /api/project/:id
export const updateProject = async (req, res, next) => {
  try {
    const company = req.user.company._id;

    const project = await Project.findOne({
      _id: req.params.id,
      company,
      deleted: false
    });

    if (!project)
      return next(AppError.notFound('Project not found'));

    // If projectCode is charging, check for duplicates
    if (req.body.projectCoe && req.body.projectCode.toUpperCase() !== project.projectCode) {
      const duplicate = await Project.findOne({
        company,
        projectCode: req.body.projectCode.toUpperCase()
      });
      if (duplicate)
        return next(AppError.conflict('A project with this code already exists in your company'));
    }

    // If client is charging, verify it belongs to the same company
    if (req.body.client) {
      const client = await Client.findOne({
        _id: req.body.client,
        company,
        deleted: false
      });
      if (!client)
        return next(AppError.notFound('Client not found in your company'));
    }

    Object.assign(project, req.body);
    await project.save();

    res.json({ ok: true, project });
  } catch (err) {
    next(err);
  }
};

