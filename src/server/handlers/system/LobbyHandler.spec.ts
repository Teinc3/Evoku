import { jest } from '@jest/globals';

import LobbyActions from '@shared/types/enums/actions/system/lobby';
import LobbyHandler from './LobbyHandler';

import type SessionModel from '../../models/networking/Session';


// Mock classes for testing
class MockSession {
  constructor(public readonly uuid: string) {}
  send = jest.fn();
  forward = jest.fn();
}

describe('LobbyHandler', () => {
  let lobbyHandler: LobbyHandler;
  let mockSession: MockSession;

  beforeEach(() => {
    jest.clearAllMocks();
    lobbyHandler = new LobbyHandler();
    mockSession = new MockSession('test-session');
  });

  describe('handleJoinQueue', () => {
    it('should handle JOIN_QUEUE action and return true', async () => {
      // Arrange
      const joinQueueData = {
        action: LobbyActions.JOIN_QUEUE,
        clientTime: 1000,
      };

      // Act
      const result = await lobbyHandler.handleData(mockSession as unknown as SessionModel, joinQueueData);

      // Assert
      expect(result).toBe(true);
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
    });
  });
});
