// src/app.js
// Main Express application. Configures middleware, mounts routes, sets up
// Socket.IO on the same HTTP server, and attaches the global error handler.
// The HTTP server instance (not the Express app) is exported because Socket.IO
// needs it, and index.js calls server.listen() directly.
import jwt from 'jsonwebtoken';
import config from './config/index.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimiter from './middleware/rate-limit.js';
import { swaggerServe, swaggerSetup } from './config/swagger.js';
import { Server } from 'socket.io';
import http from 'http';
import errorHandler from './middleware/error-handler.js';
import mongoose from 'mongoose';

// -- Route imports
import userRoutes from './routes/user.routes.js';
import clientRoutes from './routes/client.routes.js';
import projectRoutes from './routes/project.routes.js';
import deliveryNoteRoutes from './routes/deliverynote.routes.js';

// -- Express + HTTP server
// We wrap Express in a raw http.Server so Socket.IO can share the same port.
const app = express();
const server = http.createServer(app);

// -- Socket.IO setup
// Socket.IO is attached to the HTTP server and configured with the same CORS
// origin as Express so the frontend can connect from its dev server.
export const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
});

// Store the io instance on the app so controllers can access it via req.app.get('io')
app.set('io', io);

// JWT authentication middleware for Socket.IO connections.
// Runs before the 'connection' event — rejects the handshake if the token is
// missing or invalid, preventing unauthenticated sockets from joining any room.
io.use((socket, next) => {
  try {
    const raw =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization;

    if (!raw) return next(new Error('Access token required'));

    // Accept both "Bearer <token>" format and a raw token string
    const token = raw.startsWith('Bearer ') ? raw.split(' ')[1] : raw;

    // Verify and decode, throws if the token is expired or tampered with
    const payload = jwt.verify(token, config.JWT_SECRET);
    socket.user = payload;
    next();
  } catch (error) {
    next(new Error('Invalid or expired token'));
  }
});

// Connection handler: join the company-specific room so events can be
// broadcast to all sockets belonging to the same company.
io.on('connection', (socket) => {
  // company may be a populated object or a raw ObjectId string
  const companyId = socket.user.company?._id || socket.user.company;
  socket.join(companyId.toString());

  socket.on('disconnect', () => {
    socket.leave(companyId.toString());
  });
});

// Helper exported for controllers: emit an event to all sockets in a company room
export const emitToCompany = (companyId, event, data) => {
  io.to(companyId.toString()).emit(event, data);
};

// -- Global middleware
// Helmet adds security-related HTTP headers (X-Frame-Options, CSP, etc.)
app.use(helmet());

// CORS, allow the configured frontend origin to make cross-origin requests
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// Parse JSON and URL-encoded request bodies up to 10 MB (needed for signature uploads)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting, 100 requests per 15 minutes per IP by default.
app.use(rateLimiter)

// -- Swagger UI
// Available at /api-docs — reads the OpenAPI spec built in src/config/swagger.js
app.use('/api-docs', swaggerServe, swaggerSetup);

// -- Application routes
app.use('/api/user', userRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/deliverynote', deliveryNoteRoutes);

// Health check, returns DB connection state and server uptime.
// Useful for container orchestration readiness probes (e.g. Docker, Kubernetes).
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// -- Global error handler
// Must be the last middleware. Catches all errors forwarded via next(err),
// including AppError instances from controllers and Zod validation errors.
app.use(errorHandler);

export default server;
