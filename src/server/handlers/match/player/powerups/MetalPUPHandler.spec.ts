import { jest } from '@jest/globals';

import MatchStatus from '@shared/types/enums/matchstatus';
import MetalPUPActions from '@shared/types/enums/actions/match/player/powerups/metal';
import { ProtocolActions } from '@shared/types/enums/actions';
import MetalPUPHandler from "./MetalPUPHandler";

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
    setPUPPendingEffect: jest.fn(),
  };

  constructor(public readonly roomID: string) {}

  public getPlayerID(): number {
    return 0;
  }
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
        targetID: 1,
        value: 10,
      };

      // Act
      const result = await metalPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useLockData
      );

      // Assert
      expect(result).toBe(true);

      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).toHaveBeenCalledWith(
        MetalPUPActions.LOCK_USED,
        expect.objectContaining({
          actionID: 42,
          pupID: 1,
          targetID: 1,
          value: 10,
          playerID: 0,
          serverTime: 1234,
        })
      );

      expect(mockRoom.stateController.setPUPPendingEffect).toHaveBeenCalledWith(0, 1, {
        targetID: 1,
        value: 10
      });
    });

    it('should return false if targetID is invalid', async () => {
      const useLockData = {
        action: MetalPUPActions.USE_LOCK,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 0,
        value: 10,
      };
      const result = await metalPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useLockData
      );
      expect(result).toBe(false);
    });

    it('should return false if value is invalid', async () => {
      const useLockData = {
        action: MetalPUPActions.USE_LOCK,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 1,
        value: -5,
      };
      const result = await metalPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useLockData
      );
      expect(result).toBe(false);
    });

    it('should reject and return true if consumePUP fails', async () => {
      (mockRoom.stateController.consumePUP as jest.Mock).mockReturnValue(false);
      const useLockData = {
        action: MetalPUPActions.USE_LOCK,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 1,
        value: 10,
      };
      const result = await metalPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useLockData
      );
      expect(result).toBe(true);
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        ProtocolActions.REJECT_ACTION,
        expect.objectContaining({ actionID: 42 }),
        expect.anything()
      );
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

      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).toHaveBeenCalledWith(
        MetalPUPActions.FORGE_USED,
        expect.objectContaining({
          actionID: 43,
          pupID: 2,
          playerID: 0,
          serverTime: 1234,
        })
      );
    });

    it('should reject and return true if consumePUP fails', async () => {
      (mockRoom.stateController.consumePUP as jest.Mock).mockReturnValue(false);
      const useForgeData = {
        action: MetalPUPActions.USE_FORGE,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
      };
      const result = await metalPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useForgeData
      );
      expect(result).toBe(true);
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        ProtocolActions.REJECT_ACTION,
        expect.objectContaining({ actionID: 43 }),
        expect.anything()
      );
    });
  });
});
