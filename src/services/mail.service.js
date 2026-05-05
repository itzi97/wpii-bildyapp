// src/services/mail.service.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: parseInt(process.env.MAIL_PORT) || 587,
  secure: process.env.MAIL_SECURE === 'true',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export async function sendVerificationEmail(to, code) {
  await transporter.sendMail({
    from: `"BildyApp" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
    to,
    subject: 'Your BildyAppverification code',
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
