import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// 1. Mock middlewares and services BEFORE importing app
vi.mock('../../shared/middleware/authenticate', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'test-user-id', email: 'test@example.com', name: 'Test User', emailVerified: true };
    next();
  },
  optionalAuth: (req: any, res: any, next: any) => {
    next();
  }
}));

vi.mock('./auth.service', () => ({
  authService: {
    signup: vi.fn(),
    login: vi.fn(),
    verifyEmail: vi.fn(),
    resendVerification: vi.fn(),
    refreshSession: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    getOAuthUrl: vi.fn(),
    completeOnboarding: vi.fn(),
    getSession: vi.fn(),
    deleteAccount: vi.fn(),
  }
}));

vi.mock('./passkey.service', () => ({
  passkeyService: {
    generateRegistrationOptions: vi.fn(),
    verifyRegistration: vi.fn(),
    generateAuthenticationOptions: vi.fn(),
    verifyAuthentication: vi.fn(),
  }
}));

import app from '../../index';
import { authService } from './auth.service';
import { passkeyService } from './passkey.service';

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/signup', () => {
    it('should validate inputs', async () => {
      const res = await request(app).post('/api/auth/signup').send({});
      expect(res.status).toBe(422);
      expect(res.body.success).toBe(false);
    });

    it('should call authService.signup and return 201', async () => {
      vi.mocked(authService.signup).mockResolvedValueOnce({
        id: 'some-id',
        email: 'test@example.com',
        fullName: 'Test User',
        emailVerified: false,
        message: 'Signup successful.'
      } as any);

      const res = await request(app).post('/api/auth/signup').send({
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User'
      });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain('Account created');
      expect(authService.signup).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        fullName: 'Test User'
      });
    });
  });

  describe('POST /api/auth/verify-email', () => {
    it('should validate inputs', async () => {
      const res = await request(app).post('/api/auth/verify-email').send({});
      expect(res.status).toBe(422);
    });

    it('should verify email successfully', async () => {
      vi.mocked(authService.verifyEmail).mockResolvedValueOnce({ message: 'Email verified successfully.' } as any);
      const res = await request(app).post('/api/auth/verify-email').send({ email: 'test@test.com', token: '123456' });
      expect(res.status).toBe(200);
      expect(authService.verifyEmail).toHaveBeenCalledWith('test@test.com', '123456');
    });
  });

  describe('POST /api/auth/resend-verification', () => {
    it('should validate inputs', async () => {
      const res = await request(app).post('/api/auth/resend-verification').send({});
      expect(res.status).toBe(422);
    });

    it('should resend verification successfully', async () => {
      vi.mocked(authService.resendVerification).mockResolvedValueOnce({ message: 'Sent' });
      const res = await request(app).post('/api/auth/resend-verification').send({ email: 'test@test.com' });
      expect(res.status).toBe(200);
      expect(authService.resendVerification).toHaveBeenCalledWith('test@test.com');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should validate inputs', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(422);
    });

    it('should login successfully', async () => {
      vi.mocked(authService.login).mockResolvedValueOnce({
        user: { id: '1', email: 'test@test.com', fullName: 'T', emailVerified: true },
        session: { accessToken: 'token', refreshToken: 'ref', expiresAt: 1, expiresIn: 1 },
        onboardingCompleted: true
      });
      const res = await request(app).post('/api/auth/login').send({ email: 'test@test.com', password: 'Password123!' });
      expect(res.status).toBe(200);
      expect(authService.login).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should validate inputs', async () => {
      const res = await request(app).post('/api/auth/refresh').send({});
      expect(res.status).toBe(422);
    });

    it('should refresh token successfully', async () => {
      vi.mocked(authService.refreshSession).mockResolvedValueOnce({ session: {} as any });
      const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'ref-token' });
      expect(res.status).toBe(200);
      expect(authService.refreshSession).toHaveBeenCalledWith('ref-token');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should validate inputs', async () => {
      const res = await request(app).post('/api/auth/forgot-password').send({});
      expect(res.status).toBe(422);
    });

    it('should send forgot password email', async () => {
      vi.mocked(authService.forgotPassword).mockResolvedValueOnce({ message: 'Sent' });
      const res = await request(app).post('/api/auth/forgot-password').send({ email: 'test@test.com' });
      expect(res.status).toBe(200);
      expect(authService.forgotPassword).toHaveBeenCalledWith('test@test.com');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should validate inputs', async () => {
      const res = await request(app).post('/api/auth/reset-password').send({});
      expect(res.status).toBe(422);
    });

    it('should reset password successfully', async () => {
      vi.mocked(authService.resetPassword).mockResolvedValueOnce({ message: 'Done' });
      const res = await request(app).post('/api/auth/reset-password').send({ accessToken: 'token', password: 'NewPassword123!' });
      expect(res.status).toBe(200);
      expect(authService.resetPassword).toHaveBeenCalledWith('token', 'NewPassword123!');
    });
  });

  describe('GET /api/auth/oauth/:provider', () => {
    it('should get oauth url and redirect', async () => {
      vi.mocked(authService.getOAuthUrl).mockResolvedValueOnce({ url: 'http://oauth-url' });
      const res = await request(app).get('/api/auth/oauth/google');
      expect(res.status).toBe(302);
      expect(res.header.location).toBe('http://oauth-url');
      expect(authService.getOAuthUrl).toHaveBeenCalledWith('google', expect.any(String));
    });
  });

  describe('Protected Routes', () => {
    describe('POST /api/auth/logout', () => {
      it('should logout user', async () => {
        vi.mocked(authService.logout).mockResolvedValueOnce({ message: 'Logged out' });
        const res = await request(app).post('/api/auth/logout').set('Authorization', 'Bearer fake-token');
        expect(res.status).toBe(200);
        expect(authService.logout).toHaveBeenCalledWith('test-user-id');
      });
    });

    describe('GET /api/auth/me', () => {
      it('should get current user session', async () => {
        vi.mocked(authService.getSession).mockResolvedValueOnce({ id: 'test-user-id' } as any);
        const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer fake-token');
        expect(res.status).toBe(200);
        expect(authService.getSession).toHaveBeenCalledWith('test-user-id');
      });
    });

    describe('POST /api/auth/onboarding', () => {
      it('should validate inputs', async () => {
        const res = await request(app).post('/api/auth/onboarding').set('Authorization', 'Bearer fake-token').send({});
        expect(res.status).toBe(422);
      });

      it('should complete onboarding', async () => {
        vi.mocked(authService.completeOnboarding).mockResolvedValueOnce({ message: 'Done' } as any);
        const res = await request(app).post('/api/auth/onboarding').set('Authorization', 'Bearer fake-token').send({
          defaultCurrency: 'INR',
          account: {
            accountName: 'Main',
            type: 'bank_account',
            initialBalancePaise: 1000
          }
        });
        expect(res.status).toBe(200);
        expect(authService.completeOnboarding).toHaveBeenCalledWith('test-user-id', expect.any(Object));
      });
    });

    describe('PUT /api/auth/profile', () => {
      it('should validate inputs', async () => {
        const res = await request(app).put('/api/auth/profile').set('Authorization', 'Bearer fake-token').send({ fullName: 123 });
        expect(res.status).toBe(422);
      });

      it('should update profile', async () => {
        vi.mocked(authService.updateProfile).mockResolvedValueOnce({ message: 'Done' });
        const res = await request(app).put('/api/auth/profile').set('Authorization', 'Bearer fake-token').send({ fullName: 'New Name' });
        expect(res.status).toBe(200);
        expect(authService.updateProfile).toHaveBeenCalledWith('test-user-id', { fullName: 'New Name' });
      });
    });

    describe('DELETE /api/auth/account', () => {
      it('should delete account', async () => {
        vi.mocked(authService.deleteAccount).mockResolvedValueOnce({ message: 'Done' });
        const res = await request(app).delete('/api/auth/account').set('Authorization', 'Bearer fake-token');
        expect(res.status).toBe(200);
        expect(authService.deleteAccount).toHaveBeenCalledWith('test-user-id');
      });
    });
  });

  describe('Passkey Routes', () => {
    describe('GET /api/auth/passkey/register/options', () => {
      it('should generate registration options', async () => {
        vi.mocked(passkeyService.generateRegistrationOptions).mockResolvedValueOnce({} as any);
        const res = await request(app).get('/api/auth/passkey/register/options').set('Authorization', 'Bearer fake-token');
        expect(res.status).toBe(200);
        expect(passkeyService.generateRegistrationOptions).toHaveBeenCalledWith('test-user-id');
      });
    });

    describe('POST /api/auth/passkey/register/verify', () => {
      it('should verify registration', async () => {
        vi.mocked(passkeyService.verifyRegistration).mockResolvedValueOnce({} as any);
        const res = await request(app).post('/api/auth/passkey/register/verify').set('Authorization', 'Bearer fake-token').send({ response: {} });
        expect(res.status).toBe(200);
        expect(passkeyService.verifyRegistration).toHaveBeenCalledWith('test-user-id', { response: {} });
      });
    });

    describe('POST /api/auth/passkey/authenticate/options', () => {
      it('should generate auth options', async () => {
        vi.mocked(passkeyService.generateAuthenticationOptions).mockResolvedValueOnce({} as any);
        const res = await request(app).post('/api/auth/passkey/authenticate/options').send({ email: 'test@test.com' });
        expect(res.status).toBe(200);
        expect(passkeyService.generateAuthenticationOptions).toHaveBeenCalledWith('test@test.com');
      });
    });

    describe('POST /api/auth/passkey/authenticate/verify', () => {
      it('should verify auth', async () => {
        vi.mocked(passkeyService.verifyAuthentication).mockResolvedValueOnce({} as any);
        const res = await request(app).post('/api/auth/passkey/authenticate/verify').send({ email: 'test@test.com', response: {} });
        expect(res.status).toBe(200);
        expect(passkeyService.verifyAuthentication).toHaveBeenCalledWith('test@test.com', {});
      });
    });
  });
});
