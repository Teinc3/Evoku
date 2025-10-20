import { jest } from '@jest/globals';

import MetalPUPActions from '@shared/types/enums/actions/match/player/powerups/metal';
import MetalPUPHandler from "./MetalPUPHandler";

import type SessionModel from '../../../../models/networking/Session';
import type RoomModel from '../../../../models/networking/Room';


// Mock classes for testing
class MockSession {
  constructor(public readonly uuid: string) {}
  send = jest.fn();
  forward = jest.fn();
}

class MockRoom {
  constructor(public readonly roomID: string) {}
}

describe('MetalPUPHandler', () => {
  let metalPUPHandler: MetalPUPHandler;
  let mockRoom: MockRoom;
  let mockSession: MockSession;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom = new MockRoom('test-room');
    mockSession = new MockSession('test-session');
    metalPUPHandler = new MetalPUPHandler(mockRoom as unknown as RoomModel);
  });

  describe('handleUseLock', () => {
    it('should handle USE_LOCK action and return true', async () => {
      // Arrange
      const useLockData = {
        action: MetalPUPActions.USE_LOCK,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 2,
        value: 10,
      };

      // Act
      const result = await metalPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useLockData
      );

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('handleUseForge', () => {
    it('should handle USE_FORGE action and return true', async () => {
      // Arrange
      const useForgeData = {
        action: MetalPUPActions.USE_FORGE,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
      };

      // Act
      const result = await metalPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useForgeData
      );

      // Assert
      expect(result).toBe(true);
    });
  });
});
