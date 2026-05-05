// src/index.js
import server from './app.js'
import { connectDB } from './config/index.js';

// Default 3000 if port not specified.
const PORT = process.env.PORT || 3000;

// Connect to MongoDB before listening.
await connectDB();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Socket.IO server active`);
});
