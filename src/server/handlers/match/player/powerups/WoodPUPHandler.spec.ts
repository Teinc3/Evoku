import { jest } from '@jest/globals';

import MatchStatus from '@shared/types/enums/matchstatus';
import WoodPUPActions from '@shared/types/enums/actions/match/player/powerups/wood';
import WoodPUPHandler from "./WoodPUPHandler";

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { RoomModel } from '../../../../models/networking';
import type { SessionModel } from '../../../../models/networking';


// Mock classes for testing
class MockSession {
  constructor(public readonly uuid: string) {}
  send = jest.fn();
  forward = jest.fn();
}

class MockRoom {
  public broadcast = jest.fn();
  public timeService = {
    assessTiming: jest.fn().mockReturnValue(0),
    updateLastActionTime: jest.fn().mockReturnValue(1234),
  };
  public stateController = {
    matchState: { status: MatchStatus.ONGOING },
    canUsePUP: jest.fn().mockReturnValue(true),
    consumePUP: jest.fn().mockReturnValue(1234),
    computeHash: jest.fn().mockReturnValue(0),
    getSolution: jest.fn().mockReturnValue(5),
  };

  constructor(public readonly roomID: string) {}

  public getPlayerID(): number {
    return 0;
  }
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
    it('should handle USE_ENTANGLE action and return true', async () => {
      // Arrange
      const useEntangleData: AugmentAction<WoodPUPActions.USE_ENTANGLE> = {
        action: WoodPUPActions.USE_ENTANGLE,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 1,
      };

      // Act
      const result = await woodPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useEntangleData
      );

      // Assert
      expect(result).toBe(true);

      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).toHaveBeenCalledWith(
        WoodPUPActions.ENTANGLE_USED,
        expect.objectContaining({
          actionID: 42,
          pupID: 1,
          targetID: 1,
          playerID: 0,
          serverTime: 1234,
        })
      );
    });
  });

  describe('handleUseWisdom', () => {
    it('should handle USE_WISDOM action and return true', async () => {
      // Arrange
      const useWisdomData: AugmentAction<WoodPUPActions.USE_WISDOM> = {
        action: WoodPUPActions.USE_WISDOM,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
      };

      // Act
      const result = await woodPUPHandler.handleData(
        mockSession as unknown as SessionModel, 
        useWisdomData
      );

      // Assert
      expect(result).toBe(true);

      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).toHaveBeenCalledWith(
        WoodPUPActions.WISDOM_USED,
        expect.objectContaining({
          actionID: 43,
          pupID: 2,
          playerID: 0,
          serverTime: 1234,
        })
      );
    });
  });
});
