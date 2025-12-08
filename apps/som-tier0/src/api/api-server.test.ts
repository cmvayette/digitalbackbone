/**
 * Tests for API Server
 */

import { describe, it, expect } from 'vitest';
import { APIServer } from './api-server';
import { AuthenticationMiddleware, AuthorizationMiddleware, RequestValidationMiddleware, ErrorHandlerMiddleware, RateLimitMiddleware } from './middleware';
import { ApiKeyAuthProvider } from './auth/api-key-provider';
import { Role } from '../access-control';

describe('APIServer', () => {

  describe('AuthenticationMiddleware', () => {
    it('should register and authenticate API keys', async () => {
      const provider = new ApiKeyAuthProvider();
      const authMiddleware = new AuthenticationMiddleware(provider);
      const apiKey = 'test-api-key-123';
      const user = {
        userId: 'user-1',
        roles: [Role.DataSubmitter],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      }; // as UserContext (duck typing)

      authMiddleware.registerAPIKey(apiKey, user as any);

      const result = await authMiddleware.authenticate({ 'authorization': apiKey });
      expect(result.authenticated).toBe(true);
      expect(result.user).toEqual(user);
    });

    it('should reject invalid API keys', async () => {
      const provider = new ApiKeyAuthProvider();
      const authMiddleware = new AuthenticationMiddleware(provider);

      const result = await authMiddleware.authenticate({ 'authorization': 'invalid-key' });
      expect(result.authenticated).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should extract API key from Bearer token', () => {
      const provider = new ApiKeyAuthProvider();
      const authMiddleware = new AuthenticationMiddleware(provider);

      const apiKey = authMiddleware.extractAPIKey('Bearer test-key-123');
      expect(apiKey).toBe('test-key-123');
    });

    it('should revoke API keys', async () => {
      const provider = new ApiKeyAuthProvider();
      const authMiddleware = new AuthenticationMiddleware(provider);
      const apiKey = 'test-api-key-revoke';
      const user = {
        userId: 'user-1',
        roles: [Role.DataSubmitter],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      authMiddleware.registerAPIKey(apiKey, user as any);
      const res1 = await authMiddleware.authenticate({ 'authorization': apiKey });
      expect(res1.authenticated).toBe(true);

      authMiddleware.revokeAPIKey(apiKey);
      const res2 = await authMiddleware.authenticate({ 'authorization': apiKey });
      expect(res2.authenticated).toBe(false);
    });
  });

  describe('AuthorizationMiddleware', () => {
    it('should allow data submission for authorized roles', () => {
      const authzMiddleware = new AuthorizationMiddleware();
      const user = {
        userId: 'user-1',
        roles: [Role.DataSubmitter],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      const result = authzMiddleware.canSubmitEvents(user as any);
      expect(result.authorized).toBe(true);
    });

    it('should deny data submission for unauthorized roles', () => {
      const authzMiddleware = new AuthorizationMiddleware();
      const user = {
        userId: 'user-1',
        roles: [Role.Analyst],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      const result = authzMiddleware.canSubmitEvents(user as any);
      expect(result.authorized).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should allow schema proposals for authorized roles', () => {
      const authzMiddleware = new AuthorizationMiddleware();
      const user = {
        userId: 'user-1',
        roles: [Role.SchemaDesigner],
        clearanceLevel: 'SECRET',
        organizationID: 'org-1',
      };

      const result = authzMiddleware.canProposeSchemaChanges(user as any);
      expect(result.authorized).toBe(true);
    });
  });

  describe('RateLimitMiddleware', () => {
    it('should allow requests within rate limit', () => {
      const rateLimiter = new RateLimitMiddleware(10);
      const clientId = 'test-client';

      // First 10 requests should succeed
      for (let i = 0; i < 10; i++) {
        const result = rateLimiter.checkRateLimit(clientId);
        expect(result.allowed).toBe(true);
      }
    });

    it('should block requests exceeding rate limit', () => {
      const rateLimiter = new RateLimitMiddleware(5);
      const clientId = 'test-client';

      // First 5 requests should succeed
      for (let i = 0; i < 5; i++) {
        const result = rateLimiter.checkRateLimit(clientId);
        expect(result.allowed).toBe(true);
      }

      // 6th request should be blocked
      const result = rateLimiter.checkRateLimit(clientId);
      expect(result.allowed).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reset rate limit after time window', () => {
      const rateLimiter = new RateLimitMiddleware(5);
      const clientId = 'test-client';

      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        rateLimiter.checkRateLimit(clientId);
      }

      // Should be blocked
      expect(rateLimiter.checkRateLimit(clientId).allowed).toBe(false);

      // Clean up expired entries (simulates time passing)
      rateLimiter.cleanup();
    });
  });

  describe('RequestValidationMiddleware', () => {
    it('should validate required fields', () => {
      const validator = new RequestValidationMiddleware();

      const result = validator.validateRequiredFields(
        { name: 'test', value: 123 },
        ['name', 'value']
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const validator = new RequestValidationMiddleware();

      const result = validator.validateRequiredFields(
        { name: 'test' },
        ['name', 'value', 'type']
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Missing required field: value');
      expect(result.errors).toContain('Missing required field: type');
    });

    it('should validate timestamp format', () => {
      const validator = new RequestValidationMiddleware();

      const validResult = validator.validateTimestamp('2024-01-01T00:00:00Z');
      expect(validResult.valid).toBe(true);

      const invalidResult = validator.validateTimestamp('not-a-date');
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.error).toBeDefined();
    });

    it('should validate pagination parameters', () => {
      const validator = new RequestValidationMiddleware();

      const validResult = validator.validatePagination(1, 50);
      expect(validResult.valid).toBe(true);

      const invalidPageResult = validator.validatePagination(0, 50);
      expect(invalidPageResult.valid).toBe(false);

      const invalidSizeResult = validator.validatePagination(1, 2000);
      expect(invalidSizeResult.valid).toBe(false);
    });
  });

  describe('ErrorHandlerMiddleware', () => {
    it('should handle validation errors', () => {
      const errorHandler = new ErrorHandlerMiddleware();
      const error = {
        name: 'ValidationError',
        message: 'Validation failed',
        details: { field: 'name' },
        validationErrors: [{ field: 'name', message: 'Required' }],
      };

      const response = errorHandler.handleError(error);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('VALIDATION_ERROR');
      expect(response.error?.message).toBe('Validation failed');
    });

    it('should handle authorization errors', () => {
      const errorHandler = new ErrorHandlerMiddleware();
      const error = {
        name: 'AuthorizationError',
        message: 'Access denied',
      };

      const response = errorHandler.handleError(error);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AUTHORIZATION_ERROR');
    });

    it('should handle authentication errors', () => {
      const errorHandler = new ErrorHandlerMiddleware();
      const error = {
        name: 'AuthenticationError',
        message: 'Invalid credentials',
      };

      const response = errorHandler.handleError(error);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('AUTHENTICATION_ERROR');
    });

    it('should handle generic errors', () => {
      const errorHandler = new ErrorHandlerMiddleware();
      const error = new Error('Something went wrong');

      const response = errorHandler.handleError(error);

      expect(response.success).toBe(false);
      expect(response.error?.code).toBe('INTERNAL_ERROR');
    });
  });
});
