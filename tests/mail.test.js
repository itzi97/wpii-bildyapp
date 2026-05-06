// tests/mail.service.test.js
import { sendVerificationEmail } from '../src/services/mail.service.js';

describe('mail.service', () => {
  it('exports sendVerificationEmail function', () => {
    expect(typeof sendVerificationEmail).toBe('function');
  });
});
