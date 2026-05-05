// src/services/logger.service.js

import axios from 'axios';

const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export async function logErrorToSlack(err, req) {
  if (!SLACK_WEBHOOK_URL) return;

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
        { title: 'Stack', value: `\`\`\`${(err.stack || '').slice(0, 1000)}\`\`\``, short: false },
      ]
    }],
  };

  try {
    await axios.post(SLACK_WEBHOOK_URL, message);
  } catch (err) {
    console.error('Failed to send Slack notification:', err.message);
  }
}
