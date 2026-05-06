// src/services/mail.service.js
// Wraps Nodemailer to send transactional emails (verification codes, invites).
// The SMTP transporter is configured once at module load time using environment
// variables, so the same connection pool is reused across all calls.
import nodemailer from 'nodemailer';

// Create a reusable SMTP transporter. Credentials are injected at runtime via
// environment variables, never hardcoded. See .env.example for required keys.
const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT) || 587,
  // secure: true uses TLS (port 465); false uses STARTTLS (port 587)
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Sends a verification email containing a 6-digit code to the given address.
 * Called after registration and after invite — the user enters this code to
 * verify ownership of the email address.
 *
 * @param {string} to: Recipient email address
 * @param {string|number} code: The verification code to include in the email
 */
export async function sendVerificationEmail(to, code) {
  await transporter.sendMail({
    from: `"BildyApp" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
    to,
    subject: 'Your BildyApp verification code',
    // Plain-text fallback for email clients that don't render HTML
    text: `Your verification code is: ${code}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>BildyApp Email Verification</h2>
        <p>Use the code below to verify your account:</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;padding:16px;background:#f3f4f6;border-radius:8px;text-align:center">
          ${code}
        </div>
        <p style="color:#6b7280;font-size:13px;margin-top:16px">This code expires in 10 minutes.</p>
      </div>
    `,
  });
}
