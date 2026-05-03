import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import morgan from 'morgan';

import errorHandler from './middleware/error-handler.js';
import sanitize from './middleware/sanitize.js';
import userRoutes from './routes/user.routes.js';
import clientRouter from './routes/client.routes.js';
import projectRouter from './routes/project.routes.js';
import deliveryNoteRoutes from './routes/deliverynote.routes.js'

import {
  swaggerSpec,
  swaggerServe,
  swaggerSetup
} from './config/swagger.js';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
// app.use(mongoSanitize());
// Express 5 compatibility, replaced with custom sanitize middleware
app.use(express.json({ limit: '10kb' }));
app.use(sanitize)

app.get('/', (req, res) => {
  res.status(200).json({ message: 'API running' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/user', userRoutes);
app.use('/api/client', clientRouter);
app.use('/api/project', projectRouter);
app.use('/api/deliverynote', deliveryNoteRoutes)

app.use('/api-docs', swaggerServe, swaggerSetup);

// Custom error handler, registered after all routes.
app.use(errorHandler);

export default app;
