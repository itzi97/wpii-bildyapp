import express from 'express';
import { z } from 'zod';
import validate from './middleware/validate.js';
import errorHandler from './middleware/error-handler.js';

const app = express();

app.use(express.json());

// TEST: For testing validate and errorHandler.
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

// TEST: Testing validate and errorHandler.
app.post('/api/test', validate(zTestSchema), (req, res) => {
  res.json({ body: req.body });
});

// Error handler, keep last.
app.use(errorHandler)

export default app;
