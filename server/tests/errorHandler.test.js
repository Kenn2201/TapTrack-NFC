import { describe, expect, it, vi } from 'vitest';
import { errorHandler } from '../src/middleware/errorHandler.js';

function makeResponse() {
  const res = {
    statusCode: null,
    body: null,
    status: vi.fn((code) => {
      res.statusCode = code;
      return res;
    }),
    json: vi.fn((body) => {
      res.body = body;
      return res;
    }),
  };
  return res;
}

describe('errorHandler safe operational messages', () => {
  it('keeps unexpected 5xx errors generic', () => {
    const res = makeResponse();
    const err = Object.assign(new Error('database connection string leaked here'), {
      status: 500,
      code: 'UNEXPECTED',
    });

    errorHandler(err, { id: 'test-correlation' }, res, vi.fn());

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Something went wrong while processing this action.');
    expect(res.body.error).not.toContain('database connection');
  });

  it('exposes an explicitly safe operational 503 message', () => {
    const res = makeResponse();
    const err = Object.assign(new Error('Email service is not configured on this deployment.'), {
      status: 503,
      code: 'EMAIL_NOT_CONFIGURED',
      expose: true,
    });

    errorHandler(err, { id: 'test-correlation' }, res, vi.fn());

    expect(res.statusCode).toBe(503);
    expect(res.body.code).toBe('EMAIL_NOT_CONFIGURED');
    expect(res.body.error).toBe('Email service is not configured on this deployment.');
  });
});
