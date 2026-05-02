// src/controllers/client.controller.js
import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';

// POST /api/client
export const createClient = async (req, res, next) => {
  try {
    const { id: userId, company } = req.user;

    const existing = await Client.findOne({
      company,
      cif: req.body.cif.toUpperCase()
    }
    );

    if (existing)
      return next(AppError.conflict('A client with this CIF already exists in your company'));

    const client = await Client.create({ ...req.body, user: userId, company });

    // Socker.IO - emit to company room
    req.app.get('io')?.to(company.toString()).emit('client:new', client);

    res.status(201).json({ ok: true, client });
  } catch (err) {
    next(err);
  }
};

// PUT /api/client/:id
export const updateClient = async (req, res, next) => {
  try {
    const client = await Client.findOne({
      _id: req.params.id,
      company: req.user.company,
      deleted: false
    });

    if (!client) return next(AppError.notFound('Client not found'));

    // If CIF is changing, check it isn't already taken
    if (req.body.cif && req.body.cif.toUpperCase() !== client.cif) {
      const duplicate = await Client.findOne({
        company: req.user.company,
        cif: req.body.cif.toUpperCase()
      });

      if (duplicate)
        return next(AppError.conflict('A client with this CIF already exists in your company'));
    }

    Object.assign(client, req.body);
    await client.save();

    res.json({ ok: true, client });
  } catch (err) {
    next(err);
  }
};

