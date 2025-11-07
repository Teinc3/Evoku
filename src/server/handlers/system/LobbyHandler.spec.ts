import { jest } from '@jest/globals';

import LobbyActions from '@shared/types/enums/actions/system/lobby';
import LobbyHandler from './LobbyHandler';

import type { SessionModel } from '../../models/networking';
import type { MatchmakingManager } from '../../managers';


// Mock classes for testing
class MockSession {
  constructor(public readonly uuid: string) {}
  send = jest.fn();
  forward = jest.fn();
  isAuthenticated = jest.fn().mockReturnValue(true);
}

class MockMatchmakingManager {
  joinQueue = jest.fn().mockReturnValue(true);
  leaveQueue = jest.fn();
}

describe('LobbyHandler', () => {
  let lobbyHandler: LobbyHandler;
  let mockSession: MockSession;
  let mockMatchmakingManager: MockMatchmakingManager;

  beforeEach(() => {
    jest.clearAllMocks();
    lobbyHandler = new LobbyHandler();
    mockSession = new MockSession('test-session');
    mockMatchmakingManager = new MockMatchmakingManager();
    lobbyHandler.setMatchmakingManager(mockMatchmakingManager as unknown as MatchmakingManager);
  });

  describe('handleJoinQueue', () => {
    it('should handle JOIN_QUEUE action and return true', async () => {
      // Arrange
      const joinQueueData = {
        action: LobbyActions.JOIN_QUEUE,
        username: 'TestPlayer',
        clientTime: 1000,
      };

      // Act
      const result = await lobbyHandler.handleData(
        mockSession as unknown as SessionModel, 
        joinQueueData
      );

      // Assert
      expect(result).toBe(true);
      expect(mockMatchmakingManager.joinQueue).toHaveBeenCalledWith(mockSession, 'TestPlayer');
    });

    it('should return false when matchmaking manager is not set', async () => {
      // Arrange
      const freshHandler = new LobbyHandler(); // No matchmaking manager set
      const joinQueueData = {
        action: LobbyActions.JOIN_QUEUE,
        username: 'TestPlayer',
        clientTime: 1000,
      };

      // Act
      const result = await freshHandler.handleData(
        mockSession as unknown as SessionModel,
        joinQueueData
      );

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('handleLeaveQueue', () => {
    it('should handle LEAVE_QUEUE action and return true', async () => {
      // Arrange
      const leaveQueueData = {
        action: LobbyActions.LEAVE_QUEUE,
        clientTime: 1000,
      };

      // Act
      const result = await lobbyHandler.handleData(
        mockSession as unknown as SessionModel,
        leaveQueueData
      );

      // Assert
      expect(result).toBe(true);
      expect(mockMatchmakingManager.leaveQueue).toHaveBeenCalledWith('test-session');
    });

    it('should return false when matchmaking manager is not set', async () => {
      // Arrange
      const freshHandler = new LobbyHandler(); // No matchmaking manager set
      const leaveQueueData = {
        action: LobbyActions.LEAVE_QUEUE,
        clientTime: 1000,
      };

      // Act
      const result = await freshHandler.handleData(
        mockSession as unknown as SessionModel,
        leaveQueueData
      );

      // Assert
      expect(result).toBe(false);
    });
  });
});
