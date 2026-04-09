import { EventEmitter } from 'node:events';

// Central event emitter for user lifecycle events.
const notificationService = new EventEmitter();

// Log when a user registers.
notificationService.on('user:registered', (user) => {
  console.log(`User registered: ${user.email}`);
});

// Log when a user verifies their email.
notificationService.on('user:verified', (user) => {
  console.log(`User verified: ${user.email}`);
});

// Log when a user is invited.
notificationService.on('user:invited', (payload) => {
  console.log(`User invited: ${payload.email}`);
});

// Log when a user is deleted.
notificationService.on('user:deleted', (payload) => {
  console.log(`User deleted: ${payload.email} (soft: ${payload.soft})`);
});

export default notificationService;
