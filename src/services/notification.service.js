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
notificationService.on('user:invited', (user) => {
  console.log(`User invited: ${user.email}`);
});

// Log when a user is deleted.
notificationService.on('user:deleted', (user) => {
  console.log(`User deleted: ${user.email}`);
});

export default notificationService;
