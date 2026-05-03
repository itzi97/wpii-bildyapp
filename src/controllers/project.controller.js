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

// GET /api/project
export const listProjects = async (req, res, next) => {
  try {
    const company = req.user.company._id;
    const { page = 1, limit = 10, client, name, active, sort = '-createdAt' } = req.query;

    const filter = { company, deleted: false };
    if (client) filter.client = client;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (active !== undefined) filter.active = active === 'true';

    const skip = (Number(page) - 1) * Number(limit);
    const [projects, totalItems] = await Promise.all([
      Project.find(filter).populate('client', 'name cif').sort(sort).skip(skip).limit(Number(limit)),
      Project.countDocuments(filter),
    ]);

    res.json({
      ok: true,
      projects,
      currentPage: Number(page),
      totalPages: Math.ceil((totalItems) / Number(limit)),
      totalItems,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/project/:id
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      company: req.user.company._id,
      deleted: false
    }).populate('client', 'name cif email');

    if (!project)
      return next(AppError.notFound('Project not found'));

    res.json({ ok: true, project });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/project/:id
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      company: req.user.company._id,
      deleted: false
    });

    if (!project) return next(AppError.notFound('Project not found'));

    if (req.query.soft === 'true') {
      project.deleted = true;
      await project.save();
      return res.json({ ok: true, message: 'Project archived' });
    }

    await project.deleteOne();
    res.json({ ok: true, message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/project/archived
export const listArchivedProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({
      company: req.user.company._id,
      deleted: true
    }).populate('client', 'name cif').sort('-createdAt');

    res.json({ ok: true, projects });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/project/:id/restore
export const restoreProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      company: req.user.company._id,
      deleted: true
    });

    if (!project) return next(AppError.notFound('Archived project not found'));

    project.deleted = false;
    await project.save();

    res.json({ ok: true, project });
  } catch (err) {
    next(err);
  }
};
