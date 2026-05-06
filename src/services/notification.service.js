// src/services/notification.service.js
// Internal event bus for user lifecycle notifications.
// Uses Node's built-in EventEmitter so controllers can fire-and-forget events
// (e.g. emit('user:registered', user)) without coupling themselves to the
// email or logging logic. New notification types are added by registering
// additional listeners here, no controller changes needed.
import { EventEmitter } from 'node:events';
import { sendVerificationEmail } from './mail.service.js';

const notificationService = new EventEmitter();

// Fired after a new user registers. Sends the email verification code.
notificationService.on('user:registered', async (user) => {
  if (process.env.NODE_ENV === 'test') return;
  console.log(`[notification] user:registered — ${user.email}`);
  try {
    await sendVerificationEmail(user.email, user.verificationCode);
    console.log(`[notification] verification email sent to ${user.email}`);
  } catch (err) {
    console.error(`[notification] failed to send verification email to ${user.email}:`, err.message);
  }
});

// Fired after a user successfully verifies their email address.
notificationService.on('user:verified', (user) => {
  if (process.env.NODE_ENV === 'test') return;
  console.log(`[notification] user:verified — ${user.email}`);
});

// Fired when an existing user invites a new member to their company.
// Sends the same verification code email so the invitee can set up their account.
notificationService.on('user:invited', async (payload) => {
  if (process.env.NODE_ENV === 'test') return;
  console.log(`[notification] user:invited — ${payload.email}`);
  try {
    await sendVerificationEmail(payload.email, payload.verificationCode);
    console.log(`[notification] invite email sent to ${payload.email}`);
  } catch (err) {
    console.error(`[notification] failed to send invite email to ${payload.email}:`, err.message);
  }
});

// Fired when a user account is deleted (soft or hard).
notificationService.on('user:deleted', (payload) => {
  if (process.env.NODE_ENV === 'test') return;
  console.log(`[notification] user:deleted — ${payload.email} (soft: ${payload.soft})`);
});

// Fired when a user updates their personal data (name, NIF, etc.).
notificationService.on('user:updated', (payload) => {
  if (process.env.NODE_ENV === 'test') return;
  console.log(`[notification] user:updated — userId: ${payload.userId}, fields: ${payload.updatedFields.join(', ')}`);
});

export default notificationService;
