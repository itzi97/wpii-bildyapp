// src/services/logger.service.js
// Sends 5XX error details to a Slack channel via an Incoming Webhook.
// This gives the team real-time visibility into server errors without
// needing to check logs manually. The webhook URL is kept in .env and
// is never committed to version control.
import axios from 'axios';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

/**
 * Posts a formatted 5XX error report to the configured Slack webhook.
 * Silently does nothing if SLACK_WEBHOOK_URL is not set (e.g. in development).
 *
 * @param {Error} err: The error object (AppError or native Error)
 * @param {import('express').Request} req: The Express request that triggered the error
 */
export async function logErrorToSlack(err, req) {
  // Skip silently if no webhook is configured
  if (!SLACK_WEBHOOK_URL) return;

  // Build a Slack message using the legacy attachment format for color-coded blocks
  const message = {
    text: '*BildyApp 5XX Error*',
    attachments: [{
      color: 'danger',
      fields: [
        { title: 'Timestamp', value: new Date().toISOString(), short: true },
        { title: 'Method', value: req?.method || 'N/A', short: true },
        { title: 'Route', value: req?.originalUrl || 'N/A', short: true },
        { title: 'Status', value: String(err.statusCode || 500), short: true },
        { title: 'Message', value: err.message || 'Unknown error', short: false },
        // Stack trace truncated to 1000 chars to avoid hitting Slack's message size limit
        { title: 'Stack', value: `\`\`\`${(err.stack || '').slice(0, 1000)}\`\`\``, short: false },
      ],
    }],
  };

  try {
    await axios.post(SLACK_WEBHOOK_URL, message);
  } catch (slackErr) {
    // Log locally but don't throw, a Slack failure must never crash the server
    console.error('Failed to send Slack notification:', slackErr.message);
  }
}
