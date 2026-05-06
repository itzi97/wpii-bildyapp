// tests/logger.service.test.js
import { jest } from '@jest/globals';

describe('logger.service', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it('returns early if SLACK_WEBHOOK_URL is not configured', async () => {
    delete process.env.SLACK_WEBHOOK_URL;

    const axiosPost = jest.fn();
    await jest.unstable_mockModule('axios', () => ({
      default: { post: axiosPost },
    }));

    const { logErrorToSlack } = await import('../src/services/logger.service.js');
    await logErrorToSlack(new Error('x'), { method: 'GET', originalUrl: '/x' });

    expect(axiosPost).not.toHaveBeenCalled();
  });

  it('posts formatted payload to Slack when webhook exists', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.test/mock';

    const axiosPost = jest.fn().mockResolvedValue({ status: 200 });
    await jest.unstable_mockModule('axios', () => ({
      default: { post: axiosPost },
    }));

    const { logErrorToSlack } = await import('../src/services/logger.service.js');
    const err = new Error('Boom');
    err.statusCode = 503;

    await logErrorToSlack(err, { method: 'POST', originalUrl: '/api/fail' });

    expect(axiosPost).toHaveBeenCalledTimes(1);
    expect(axiosPost.mock.calls[0][0]).toBe('https://hooks.slack.test/mock');
    expect(axiosPost.mock.calls[0][1].text).toBe('*BildyApp 5XX Error*');
  });

  it('swallows Slack post errors', async () => {
    process.env.SLACK_WEBHOOK_URL = 'https://hooks.slack.test/mock';

    const axiosPost = jest.fn().mockRejectedValue(new Error('network down'));
    await jest.unstable_mockModule('axios', () => ({
      default: { post: axiosPost },
    }));

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

    const { logErrorToSlack } = await import('../src/services/logger.service.js');
    await expect(
      logErrorToSlack(new Error('Boom'), { method: 'GET', originalUrl: '/api/fail' })
    ).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('handles Slack fetch failure gracefully', async () => {
    // Mock fetch to reject — logErrorToSlack must not throw
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      logErrorToSlack(new Error('Test error'), { method: 'GET', originalUrl: '/test' })
    ).resolves.not.toThrow();

    global.fetch = originalFetch;
  });

  it('handles non-ok Slack response gracefully', async () => {
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });

    await expect(
      logErrorToSlack(new Error('Test error'), { method: 'GET', originalUrl: '/test' })
    ).resolves.not.toThrow();

    global.fetch = originalFetch;
  });
});
