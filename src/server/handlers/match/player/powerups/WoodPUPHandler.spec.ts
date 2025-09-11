import { jest } from '@jest/globals';

import WoodPUPActions from '@shared/types/enums/actions/match/player/powerups/wood';
import WoodPUPHandler from "./WoodPUPHandler";

import type AugmentAction from '@shared/types/utils/AugmentAction';
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

describe('WoodPUPHandler', () => {
  let woodPUPHandler: WoodPUPHandler;
  let mockRoom: MockRoom;
  let mockSession: MockSession;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom = new MockRoom('test-room');
    mockSession = new MockSession('test-session');
    woodPUPHandler = new WoodPUPHandler(mockRoom as unknown as RoomModel);
  });

  describe('handleUseEntangle', () => {
    it('should handle USE_ENTANGLE action and return true', () => {
      // Arrange
      const useEntangleData: AugmentAction<WoodPUPActions.USE_ENTANGLE> = {
        action: WoodPUPActions.USE_ENTANGLE,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 2,
      };

      // Act
      const result = woodPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useEntangleData
      );

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('handleUseWisdom', () => {
    it('should handle USE_WISDOM action and return true', () => {
      // Arrange
      const useWisdomData: AugmentAction<WoodPUPActions.USE_WISDOM> = {
        action: WoodPUPActions.USE_WISDOM,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
      };

      // Act
      const result = woodPUPHandler.handleData(
        mockSession as unknown as SessionModel, 
        useWisdomData
      );

      // Assert
      expect(result).toBe(true);
    });
  });
});
