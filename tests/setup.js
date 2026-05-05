// tests/setup.js
import { jest } from '@jest/globals';

// Silence failed to send verification email spam
jest.mock('../src/services/mail.service.js', () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
}));
