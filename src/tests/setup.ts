import { vi } from 'vitest';

// Mock dependencies globally
vi.mock('../config/env', () => ({
  env: {
    PORT: 5000,
    NODE_ENV: 'test',
    APP_URL: 'http://localhost:5000',
    IS_PRODUCTION: false,
    DATABASE_URL: 'postgres://test:test@localhost:5432/test',
    SUPABASE_URL: 'https://test.supabase.co',
    SUPABASE_ANON_KEY: 'test-anon-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key-32-chars-long-!',
    CORS_ORIGIN: '*',
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX: 100,
    RESEND_API_KEY: 're_test_key',
    FRONTEND_URL: 'http://localhost:5173',
  }
}));

// Mock Database Pool
vi.mock('../config/database', () => {
  const mockPool = {
    query: vi.fn(),
    connect: vi.fn(),
    end: vi.fn(),
  };

  return {
    pool: mockPool,
    query: vi.fn((text, params) => mockPool.query(text, params)),
    getClient: vi.fn(() => mockPool.connect()),
    withTransaction: vi.fn(async (fn) => {
      const client = await mockPool.connect();
      try {
        const res = await fn(client);
        return res;
      } finally {
        if (client.release) client.release();
      }
    }),
  };
});

// Mock Email Service
vi.mock('../services/emailService', () => ({
  sendOTP: vi.fn().mockResolvedValue(true),
  sendWelcomeEmail: vi.fn().mockResolvedValue(true),
}));
