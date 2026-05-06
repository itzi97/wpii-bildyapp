// src/controllers/project.controller.js
import Project from '../models/Project.js';
import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';

// -- POST /api/project
// Creates a new project linked to the authenticated user's company.
// Before inserting, it verifies that the referenced client belongs to the same
// company, and that the project code is unique within the company.
// On success, emits a Socket.IO 'project:new' event to the company room.
export const createProject = async (req, res, next) => {
  try {
    const userId = req.user._id || req.user.id;
    const company = req.user.company?._id || req.user.company;

    // The client must exist and belong to this company, cross-company references are not allowed
    const client = await Client.findOne({
      _id: req.body.client,
      company,
      deleted: false,
    });

    if (!client) return next(AppError.notFound('Client not found in your company'));

    // Project codes are stored uppercase, normalise before checking for duplicates
    const existing = await Project.findOne({
      company,
      projectCode: req.body.projectCode.toUpperCase(),
    });

    if (existing)
      return next(AppError.conflict('A project with this code already exists in your company'));

    const project = await Project.create({ ...req.body, user: userId, company });

    // Notify all sockets in the company room about the new project
    req.app.get('io')?.to(company.toString()).emit('project:new', project);

    res.status(201).json({ data: project });
  } catch (err) {
    next(err);
  }
};

// -- PUT /api/project/:id
// Updates an existing active project. If the project code is changing, a
// duplicate check is run first. If the client reference is changing, it is
// re-validated to ensure it still belongs to the same company.
export const updateProject = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;

    const project = await Project.findOne({
      _id: req.params.id,
      company,
      deleted: false,
    });

    if (!project) return next(AppError.notFound('Project not found'));

    // Only check for duplicate code when the incoming value differs from the current one
    if (req.body.projectCode && req.body.projectCode.toUpperCase() !== project.projectCode) {
      const duplicate = await Project.findOne({
        company,
        projectCode: req.body.projectCode.toUpperCase(),
      });

      if (duplicate)
        return next(AppError.conflict('A project with this code already exists in your company'));
    }

    // Re-validate the client reference if it is being updated
    if (req.body.client) {
      const client = await Client.findOne({
        _id: req.body.client,
        company,
        deleted: false,
      });

      if (!client) return next(AppError.notFound('Client not found in your company'));
    }

    // Merge incoming fields onto the existing document and persist
    Object.assign(project, req.body);
    await project.save();

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
};

// -- GET /api/project
// Returns a paginated list of active projects for the authenticated user's
// company. Supports optional filtering by client ID, name, and active status.
export const listProjects = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;
    const { page = 1, limit = 10, client, name, active, sort = '-createdAt' } = req.query;

    // Build the filter, always scope to company and exclude soft-deleted records
    const filter = { company, deleted: false };
    if (client) filter.client = client;
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (active !== undefined) filter.active = active === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    // Run count and find in parallel to reduce total DB round-trips
    const [projects, totalItems] = await Promise.all([
      Project.find(filter).populate('client', 'name cif').sort(sort).skip(skip).limit(Number(limit)),
      Project.countDocuments(filter),
    ]);

    res.json({
      data: projects,
      currentPage: Number(page),
      totalPages: Math.ceil(totalItems / Number(limit)),
      totalItems,
    });
  } catch (err) {
    next(err);
  }
};

// -- GET /api/project/:id
// Fetches a single active project by ID, scoped to the authenticated user's
// company. Populates the client field with name, cif, and email for display.
export const getProject = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;

    const project = await Project.findOne({
      _id: req.params.id,
      company,
      deleted: false,
    }).populate('client', 'name cif email');

    if (!project) return next(AppError.notFound('Project not found'));

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
};

// -- DELETE /api/project/:id
// Deletes a project. Behaviour depends on the ?soft=true query param:
//   - soft=true  -> marks the project as deleted (archived), keeps the DB record
//   - soft=false -> permanently removes the document from the database
export const deleteProject = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;

    const project = await Project.findOne({
      _id: req.params.id,
      company,
      deleted: false,
    });

    if (!project) return next(AppError.notFound('Project not found'));

    if (req.query.soft === 'true') {
      project.deleted = true;
      await project.save();
      return res.json({ message: 'Project archived' });
    }

    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};

// -- GET /api/project/archived
// Returns all soft-deleted (archived) projects for the authenticated user's
// company, sorted by most recently archived first.
export const listArchivedProjects = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;

    const projects = await Project.find({ company, deleted: true })
      .populate('client', 'name cif')
      .sort('-createdAt');

    res.json({ data: projects });
  } catch (err) {
    next(err);
  }
};

// -- PATCH /api/project/:id/restore
// Restores a previously soft-deleted project by setting deleted=false.
// Returns 404 if the project doesn't exist or is not currently archived.
export const restoreProject = async (req, res, next) => {
  try {
    const company = req.user.company?._id || req.user.company;

    const project = await Project.findOne({
      _id: req.params.id,
      company,
      deleted: true,
    });

    if (!project) return next(AppError.notFound('Archived project not found'));

    project.deleted = false;
    await project.save();

    res.json({ data: project });
  } catch (err) {
    next(err);
  }
};
