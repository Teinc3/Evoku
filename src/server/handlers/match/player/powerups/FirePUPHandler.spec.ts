import { jest } from '@jest/globals';

import FirePUPActions from '@shared/types/enums/actions/match/player/powerups/fire';
import FirePUPHandler from "./FirePUPHandler";

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

describe('FirePUPHandler', () => {
  let firePUPHandler: FirePUPHandler;
  let mockRoom: MockRoom;
  let mockSession: MockSession;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom = new MockRoom('test-room');
    mockSession = new MockSession('test-session');
    firePUPHandler = new FirePUPHandler(mockRoom as unknown as RoomModel);
  });

  describe('handleUseInferno', () => {
    it('should handle USE_INFERNO action and return true', async () => {
      // Arrange
      const useInfernoData = {
        action: FirePUPActions.USE_INFERNO,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 2,
        cellIndex: 5,
      };

      // Act
      const result = await firePUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useInfernoData
      );

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('handleUseMetabolic', () => {
    it('should handle USE_METABOLIC action and return true', async () => {
      // Arrange
      const useMetabolicData = {
        action: FirePUPActions.USE_METABOLIC,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
      };

      // Act
      const result = await firePUPHandler.handleData(
        mockSession as unknown as SessionModel, 
        useMetabolicData
      );

      // Assert
      expect(result).toBe(true);
    });
  });
});
