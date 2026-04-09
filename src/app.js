import express from 'express';
import errorHandler from './middleware/error-handler.js';
import userRoutes from './routes/user.routes.js'

const app = express();

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
