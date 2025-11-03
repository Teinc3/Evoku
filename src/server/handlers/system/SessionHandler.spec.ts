import { jest } from '@jest/globals';

import SessionActions from '@shared/types/enums/actions/system/session';
import sharedConfig from '@shared/config';
import guestAuthService from '../../services/GuestAuthService';
import SessionHandler from './SessionHandler';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type SessionModel from '../../models/networking/Session';


// Mock dependencies
jest.mock('../../services/GuestAuthService');

describe('SessionHandler', () => {
  let sessionHandler: SessionHandler;
  let mockSession: {
    uuid: string;
    isAuthenticated: jest.Mock;
    setAuthenticated: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    sessionHandler = new SessionHandler();
    mockSession = {
      uuid: 'test-session-uuid',
      isAuthenticated: jest.fn(() => false),
      setAuthenticated: jest.fn(),
    };
  });

  describe('handleHeartbeat', () => {
    it('should handle HEARTBEAT action and return true', async () => {
      // Arrange
      const heartbeatData: AugmentAction<SessionActions.HEARTBEAT> = {
        action: SessionActions.HEARTBEAT,
      };

      // Act
      const result = await sessionHandler.handleData(
        mockSession as unknown as SessionModel,
        heartbeatData
      );

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('handleAuth', () => {
    it('should authenticate session with valid token and version', async () => {
      // Arrange
      const authData: AugmentAction<SessionActions.AUTH> = {
        action: SessionActions.AUTH,
        token: 'valid-token',
        version: sharedConfig.version,
      };

      (guestAuthService.authenticate as jest.MockedFunction<typeof guestAuthService.authenticate>)
        .mockResolvedValue({
          token: 'new-token',
          elo: 1000,
          userID: '550e8400-e29b-41d4-a716-446655440000'
        });

      // Act
      const result = await sessionHandler.handleData(
        mockSession as unknown as SessionModel,
        authData
      );

      // Assert
      expect(result).toBe(true);
      expect(guestAuthService.authenticate).toHaveBeenCalledWith('valid-token');
      expect(mockSession.setAuthenticated).toHaveBeenCalled();
    });

    it('should reject authentication if session is already authenticated', async () => {
      // Arrange
      mockSession.isAuthenticated.mockReturnValue(true);
      const authData: AugmentAction<SessionActions.AUTH> = {
        action: SessionActions.AUTH,
        token: 'valid-token',
        version: sharedConfig.version,
      };

      // Act
      const result = await sessionHandler.handleData(
        mockSession as unknown as SessionModel,
        authData
      );

      // Assert
      expect(result).toBe(false);
      expect(mockSession.setAuthenticated).not.toHaveBeenCalled();
    });

    it('should reject authentication with invalid version', async () => {
      // Arrange
      const authData: AugmentAction<SessionActions.AUTH> = {
        action: SessionActions.AUTH,
        token: 'valid-token',
        version: '0.0.1', // Different from sharedConfig.version
      };

      // Act
      const result = await sessionHandler.handleData(
        mockSession as unknown as SessionModel,
        authData
      );

      // Assert
      expect(result).toBe(false);
      expect(mockSession.setAuthenticated).not.toHaveBeenCalled();
    });

    it('should reject authentication with invalid token', async () => {
      // Arrange
      const authData: AugmentAction<SessionActions.AUTH> = {
        action: SessionActions.AUTH,
        token: 'invalid-token',
        version: sharedConfig.version,
      };

      (guestAuthService.authenticate as jest.MockedFunction<typeof guestAuthService.authenticate>)
        .mockRejectedValue(new Error('Invalid token'));

      // Act
      const result = await sessionHandler.handleData(
        mockSession as unknown as SessionModel,
        authData
      );

      // Assert
      expect(result).toBe(false);
      expect(guestAuthService.authenticate).toHaveBeenCalledWith('invalid-token');
      expect(mockSession.setAuthenticated).not.toHaveBeenCalled();
    });
  });
});
