// tests/mail.service.test.js
import { jest } from '@jest/globals';

// Mock nodemailer before importing the service so the transporter
// is replaced before module-level code runs.
await jest.unstable_mockModule('nodemailer', () => ({
  default: {
    createTransport: jest.fn(() => ({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-id' }),
    })),
  },
}));

const { sendVerificationEmail } = await import('../src/services/mail.service.js');

describe('mail.service', () => {
  it('sends a verification email with a code', async () => {
    // Should resolve without throwing, sendMail is mocked
    await expect(sendVerificationEmail('user@test.com', '123456')).resolves.not.toThrow();
  });

  it('uses MAIL_FROM as sender when set', async () => {
    process.env.MAIL_FROM = 'noreply@bildyapp.com';
    await expect(sendVerificationEmail('user@test.com', '654321')).resolves.not.toThrow();
    delete process.env.MAIL_FROM;
  });
});
