// src/services/notification.service.js
import { EventEmitter } from 'node:events';
import { sendVerificationEmail } from './mail.service.js';

// Central event emitter for user lifecycle events.
const notificationService = new EventEmitter();

// Log when a user registers.
notificationService.on('user:registered', async (user) => {
  if (process.env.NODE_ENV === 'test') return;
  console.log(`User registered: ${user.email}`);

  try {
    await sendVerificationEmail(user.email, user.verificationCode);
    console.log(`Verification email send to: ${user.email}`);
  } catch (err) {
    console.error(`Failed to send verification email to ${user.email}`);
  }
});

// Log when a user verifies their email.
notificationService.on('user:verified', (user) => {
  if (process.env.NODE_ENV === 'test') return;
  console.log(`User verified: ${user.email}`);
});

// Log when a user is invited.
notificationService.on('user:invited', async (payload) => {
  if (process.env.NODE_ENV === 'test') return;
  console.log(`User invited: ${payload.email}`);
  try {
    await sendVerificationEmail(payload.email, payload.verificationCode);
    console.log(`Invite email sent to: ${payload.email}`);
  } catch (err) {
    console.error(`Failed to send invite email to ${payload.email}:`, err.message);
  }
});

// Log when a user is deleted.
notificationService.on('user:deleted', (payload) => {
  if (process.env.NODE_ENV === 'test') return;
  console.log(`User deleted: ${payload.email} (soft: ${payload.soft})`);
});

export default notificationService;
