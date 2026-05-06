// src/index.js
// src/index.js
import server from './app.js'
import { connectDB } from './config/index.js';
import mongoose from 'mongoose';
import { io } from './app.js';

const PORT = process.env.PORT || 3000;

await connectDB();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Socket.IO server active`);
});

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await mongoose.connection.close();
    io.close();
    console.log('Server, DB and Socket.IO closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
