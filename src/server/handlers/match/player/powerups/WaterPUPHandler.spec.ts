import { jest } from '@jest/globals';

import MatchStatus from '@shared/types/enums/matchstatus';
import WaterPUPActions from '@shared/types/enums/actions/match/player/powerups/water';
import { ProtocolActions } from '@shared/types/enums/actions';
import WaterPUPHandler from "./WaterPUPHandler";

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
  public setTrackedTimeout = jest
    .fn()
    .mockReturnValue(999 as unknown as ReturnType<typeof setTimeout>);
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
    currentChallengeDuration: 5000,
  };
  
  constructor(public readonly roomID: string) {}

  public getPlayerID(): number {
    return 0;
  }
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
        targetID: 1,
        cellIndex: 5,
      };

      // Act
      const result = await waterPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useCryoData
      );

      // Assert
      expect(result).toBe(true);

      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).toHaveBeenCalledWith(
        WaterPUPActions.CRYO_USED,
        expect.objectContaining({
          actionID: 42,
          pupID: 1,
          targetID: 1,
          cellIndex: 5,
          playerID: 0,
          serverTime: 1234,
        })
      );

      expect(mockRoom.setTrackedTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
      expect(mockRoom.stateController.setPUPPendingEffect).toHaveBeenCalledWith(
        0,
        1,
        expect.objectContaining({
          targetID: 1,
          cellIndex: 5,
          serverTimeoutID: 999,
        })
      );
    });

    it('should return false if targetID is invalid', async () => {
      const useCryoData = {
        action: WaterPUPActions.USE_CRYO,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 0,
        cellIndex: 5,
      };
      const result = await waterPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useCryoData
      );
      expect(result).toBe(false);
    });

    it('should return false if cellIndex is invalid', async () => {
      const useCryoData = {
        action: WaterPUPActions.USE_CRYO,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 1,
        cellIndex: -1,
      };
      const result = await waterPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useCryoData
      );
      expect(result).toBe(false);
    });

    it('should reject and return true if consumePUP fails', async () => {
      (mockRoom.stateController.consumePUP as jest.Mock).mockReturnValue(false);
      const useCryoData = {
        action: WaterPUPActions.USE_CRYO,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 1,
        cellIndex: 5,
      };
      const result = await waterPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useCryoData
      );
      expect(result).toBe(true);
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        ProtocolActions.REJECT_ACTION,
        expect.objectContaining({ actionID: 42 }),
        expect.anything()
      );
    });
  });

  describe('handleUsePurity', () => {
    it('should handle USE_PURITY action and return true', async () => {
      // Arrange
      const usePurityData = {
        action: WaterPUPActions.USE_PURITY,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
      };

      // Act
      const result = await waterPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        usePurityData
      );

      // Assert
      expect(result).toBe(true);

      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).toHaveBeenCalledWith(
        WaterPUPActions.PURITY_USED,
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
      const usePurityData = {
        action: WaterPUPActions.USE_PURITY,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
      };
      const result = await waterPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        usePurityData
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
