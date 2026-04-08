import express from 'express';
import { z } from 'zod';
import validate from './middleware/validate.js';
import errorHandler from './middleware/error-handler.js';

const app = express();

app.use(express.json());

// TEST: Temporary schema used to verify validation and errorHandler.
// TOOD: Remove later.
const zTestSchema = z.object({
  name: z.string().min(1),
  age: z.number().int().positive(),
});

app.get('/', (req, res) => {
  res.status(200).json({ message: 'API running' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true });
});

// TEST: Temporary route for testing validation.
// TODO: Remove later.
app.post('/api/test', validate(zTestSchema), (req, res) => {
  res.json({ body: req.body });
});

// Custom error handler, registered after all routes.
app.use(errorHandler);

export default app;
