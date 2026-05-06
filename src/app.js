// src/app.js
import jwt from 'jsonwebtoken';
import config from './config/index.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { swaggerServe, swaggerSetup } from './config/swagger.js';
import { Server } from 'socket.io';
import http from 'http';
import errorHandler from './middleware/error-handler.js';
import mongoose from 'mongoose';

// Routes
import userRoutes from './routes/user.routes.js';
import clientRoutes from './routes/client.routes.js';
import projectRoutes from './routes/project.routes.js';
import deliveryNoteRoutes from './routes/deliverynote.routes.js';

const app = express();
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
  }
});

// Store io in app
app.set('io', io);

// Socket.IO auth middleware
io.use((socket, next) => {
  try {
    const raw =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization;

    if (!raw) return next(new Error('Access token required'));

    // Accept both "Bearer <token>" and raw token directly just in case
    const token = raw.startsWith('Bearer ') ? raw.split(' ')[1] : raw;

    const payload = jwt.verify(token, config.JWT_SECRET);
    socket.user = payload;
    next();
  } catch (error) {
    console.error('Socket JWT error:', error.message);
    next(new Error('Invalid or expired token'));
  }
});

// Socket.IO events
io.on('connection', (socket) => {
  const companyId = socket.user.company._id || socket.user.company;
  socket.join(companyId.toString());

  socket.on('disconnect', () => {
    socket.leave(companyId.toString());
  });
});

// Socket.IO emit helpers
export const emitToCompany = (companyId, event, data) => {
  io.to(companyId.toString()).emit(event, data);
};

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100
}));

// Swagger Routes
app.use('/api-docs', swaggerServe, swaggerSetup);

// App Routes
app.use('/api/user', userRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/deliverynote', deliveryNoteRoutes);
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});


// Catches all errors thrown via next(err)
app.use(errorHandler);

export default server;
