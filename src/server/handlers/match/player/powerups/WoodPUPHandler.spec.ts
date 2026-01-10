import { jest } from '@jest/globals';

import MatchStatus from '@shared/types/enums/matchstatus';
import WoodPUPActions from '@shared/types/enums/actions/match/player/powerups/wood';
import reject from '../../../../utils/reject';
import WoodPUPHandler from './WoodPUPHandler';

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { RoomModel } from '../../../../models/networking';
import type { SessionModel } from '../../../../models/networking';


jest.mock('../../../../utils/reject', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: jest.fn(),
}));


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
    setPUPPendingEffect: jest.fn(),
  };

  constructor(public readonly roomID: string) {}

  public getPlayerID = jest.fn<() => number | undefined>().mockReturnValue(0);
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

      expect(mockRoom.stateController.setPUPPendingEffect).toHaveBeenCalledWith(0, 1, {
        targetID: 1
      });
    });

    it('should return false when playerID is undefined', async () => {
      const useEntangleData: AugmentAction<WoodPUPActions.USE_ENTANGLE> = {
        action: WoodPUPActions.USE_ENTANGLE,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 1,
      };

      mockRoom.getPlayerID.mockReturnValue(undefined);

      const result = await woodPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useEntangleData,
      );

      expect(result).toBe(false);
    });

    it('should return false when targetID does not match opponent', async () => {
      const useEntangleData: AugmentAction<WoodPUPActions.USE_ENTANGLE> = {
        action: WoodPUPActions.USE_ENTANGLE,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 0,
      };

      mockRoom.getPlayerID.mockReturnValue(0);

      const result = await woodPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useEntangleData,
      );

      expect(result).toBe(false);
      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).not.toHaveBeenCalled();
    });

    it('should reject action when consumePUP returns false', async () => {
      const useEntangleData: AugmentAction<WoodPUPActions.USE_ENTANGLE> = {
        action: WoodPUPActions.USE_ENTANGLE,
        actionID: 99,
        pupID: 1,
        clientTime: 1000,
        targetID: 1,
      };

      mockRoom.getPlayerID.mockReturnValue(0);
      (mockRoom.stateController.consumePUP as jest.Mock).mockReturnValue(false);

      const result = await woodPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useEntangleData,
      );

      expect(result).toBe(true);
      expect(reject).toHaveBeenCalledWith(
        mockRoom as unknown as RoomModel,
        mockSession as unknown as SessionModel,
        useEntangleData.actionID,
      );
      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).not.toHaveBeenCalled();
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

    it('should return false when playerID is undefined', async () => {
      const useWisdomData: AugmentAction<WoodPUPActions.USE_WISDOM> = {
        action: WoodPUPActions.USE_WISDOM,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
      };

      mockRoom.getPlayerID.mockReturnValue(undefined);

      const result = await woodPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useWisdomData,
      );

      expect(result).toBe(false);
    });

    it('should return false when solution lookup fails', async () => {
      const useWisdomData: AugmentAction<WoodPUPActions.USE_WISDOM> = {
        action: WoodPUPActions.USE_WISDOM,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
      };

      mockRoom.getPlayerID.mockReturnValue(0);
      (mockRoom.stateController.getSolution as jest.Mock).mockReturnValue(undefined);

      const result = await woodPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useWisdomData,
      );

      expect(result).toBe(false);
      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).not.toHaveBeenCalled();
    });
  });
});
