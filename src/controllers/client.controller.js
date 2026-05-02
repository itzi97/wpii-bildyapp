// src/controllers/client.controller.js
import Client from '../models/Client.js';
import AppError from '../utils/AppError.js';

// POST /api/client
export const createClient = async (req, res, next) => {
  try {
    const { id: userId, company } = req.user;

    const existing = await Client.findOne(
      {
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
