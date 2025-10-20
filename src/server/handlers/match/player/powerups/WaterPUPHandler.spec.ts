import { jest } from '@jest/globals';

import WaterPUPActions from '@shared/types/enums/actions/match/player/powerups/water';
import WaterPUPHandler from "./WaterPUPHandler";

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

describe('WaterPUPHandler', () => {
  let waterPUPHandler: WaterPUPHandler;
  let mockRoom: MockRoom;
  let mockSession: MockSession;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom = new MockRoom('test-room');
    mockSession = new MockSession('test-session');
    waterPUPHandler = new WaterPUPHandler(mockRoom as unknown as RoomModel);
  });

  describe('handleUseCryo', () => {
    it('should handle USE_CRYO action and return true', async () => {
      // Arrange
      const useCryoData = {
        action: WaterPUPActions.USE_CRYO,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 2,
        cellIndex: 5,
      };

      // Act
      const result = await waterPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useCryoData
      );

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('handleUseCascade', () => {
    it('should handle USE_CASCADE action and return true', async () => {
      // Arrange
      const useCascadeData = {
        action: WaterPUPActions.USE_CASCADE,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
      };

      // Act
      const result = await waterPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useCascadeData
      );

      // Assert
      expect(result).toBe(true);
    });
  });
});
