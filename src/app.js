import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import cors from 'cors';
import morgan from 'morgan';

import errorHandler from './middleware/error-handler.js';
import userRoutes from './routes/user.routes.js'

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(rateLimit({ windowsMS: 15 * 60 * 1000, max: 100 }));
app.use(mongoSanitize());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({ message: 'API running' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ ok: true });
});

app.use('/api/user', userRoutes);

// Custom error handler, registered after all routes.
app.use(errorHandler);

export default app;
