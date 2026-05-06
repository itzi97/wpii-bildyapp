// src/index.js
// Application entry point. Connects to MongoDB, then starts the HTTP server.
// Graceful shutdown handlers ensure the DB connection and Socket.IO server
// are cleanly closed before the process exits on SIGTERM or SIGINT.
import server from './app.js';
import { connectDB } from './config/index.js';
import mongoose from 'mongoose';

const PORT = process.env.PORT || 3000;

// Connect to MongoDB before accepting any HTTP traffic
await connectDB();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});

// Gracefully shut down the server on termination signals.
// server.close() stops accepting new connections and waits for existing ones
// to finish before calling the callback.
const shutdown = async (signal) => {
  console.log(`\n${signal} received — shutting down gracefully...`);
  server.close(async () => {
    await mongoose.connection.close();
    console.log('HTTP server and MongoDB connection closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
