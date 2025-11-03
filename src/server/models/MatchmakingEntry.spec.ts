import { jest } from '@jest/globals';

import LobbyActions from '@shared/types/enums/actions/system/lobby';
import MatchmakingEntryModel from "./MatchmakingEntry";

import type { UUID } from 'crypto';
import type SessionModel from "./networking/Session";
import type SessionManager from '../managers/SessionManager';


// Mock classes for testing
class MockSession implements Partial<SessionModel> {
  public uuid: UUID;
  public forward = jest.fn();

  constructor(uuid: string) {
    this.uuid = uuid as UUID;
  }
}

class MockSessionManager implements Partial<SessionManager> {
  public getOnlineCount = jest.fn<() => number>().mockReturnValue(42);
}

describe('MatchmakingEntryModel', () => {
  let mockSession: MockSession;
  let mockSessionManager: MockSessionManager;
  let entry: MatchmakingEntryModel;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = new MockSession('test-session-uuid');
    mockSessionManager = new MockSessionManager();
    entry = new MatchmakingEntryModel(
      mockSession as unknown as SessionModel,
      'TestUser',
      mockSessionManager as unknown as SessionManager
    );
  });

  describe('constructor', () => {
    it('should initialize with correct properties', () => {
      // Assert
      expect(entry.session).toBe(mockSession);
      expect(entry.username).toBe('TestUser');
      expect(entry.joinTime).toBeGreaterThan(0);
      expect(typeof entry.joinTime).toBe('number');
    });

    it('should set joinTime to current timestamp', () => {
      // Arrange
      const beforeTime = Date.now();

      // Act
      const newEntry = new MatchmakingEntryModel(
        mockSession as unknown as SessionModel,
        'TestUser2',
        mockSessionManager as unknown as SessionManager
      );

      // Assert
      expect(newEntry.joinTime).toBeGreaterThanOrEqual(beforeTime);
      expect(newEntry.joinTime).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('sendQueueUpdate', () => {
    it('should send QUEUE_UPDATE packet with correct data', () => {
      // Act
      entry.sendQueueUpdate();

      // Assert
      expect(mockSessionManager.getOnlineCount).toHaveBeenCalled();
      expect(mockSession.forward).toHaveBeenCalledWith(
        LobbyActions.QUEUE_UPDATE,
        {
          inQueue: true,
          onlineCount: 42
        }
      );
    });

    it('should call getOnlineCount on sessionManager', () => {
      // Act
      entry.sendQueueUpdate();

      // Assert
      expect(mockSessionManager.getOnlineCount).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('should not throw any errors', () => {
      // Act & Assert
      expect(() => entry.destroy()).not.toThrow();
    });

    it('should be callable multiple times', () => {
      // Act & Assert
      expect(() => {
        entry.destroy();
        entry.destroy();
        entry.destroy();
      }).not.toThrow();
    });
  });
});