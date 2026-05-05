// src/app.js
import jwt from 'jsonwebtoken';
import config from './config/index.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { Server } from 'socket.io';
import http from 'http';
import errorHandler from './middleware/error-handler.js';

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
// io.use(authenticateToken);
io.use((socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization?.split(' ')[1];

    if (!token || !token.startsWith('Bearer ')) {
      return next(new Error('Access token required'));
    }

    const parts = token.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return next(new Error('Invalid token format'));
    }

    const payload = jwt.verify(parts[1], config.JWT_SECRET);

    // Payload stored in socket directly
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


// Catches all errors thrown via next(err)
app.use(errorHandler);

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
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BildyApp API',
      version: '1.0.0',
      description: 'REST API for BildyApp delivery notes management'
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// App Routes
app.use('/api/user', userRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/deliverynote', deliveryNoteRoutes);


export default server;
