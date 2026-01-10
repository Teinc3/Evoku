import { jest } from '@jest/globals';

import MatchStatus from '@shared/types/enums/matchstatus';
import FirePUPActions from '@shared/types/enums/actions/match/player/powerups/fire';
import { ProtocolActions } from '@shared/types/enums/actions';
import FirePUPHandler from "./FirePUPHandler";

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
        targetID: 1,
        cellIndex: 5,
      };

      // Act
      const result = await firePUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useInfernoData
      );

      // Assert
      expect(result).toBe(true);

      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).toHaveBeenCalledWith(
        FirePUPActions.INFERNO_USED,
        expect.objectContaining({
          actionID: 42,
          pupID: 1,
          targetID: 1,
          cellIndex: 5,
          playerID: 0,
          serverTime: 1234,
        })
      );

      // pendingEffect should be stored server-side
      expect(mockRoom.stateController.setPUPPendingEffect).toHaveBeenCalledWith(0, 1, {
        targetID: 1,
        cellIndex: 5
      });
    });

    it('should return false if targetID is invalid', async () => {
      const useInfernoData = {
        action: FirePUPActions.USE_INFERNO,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 0,
        cellIndex: 5,
      };
      const result = await firePUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useInfernoData
      );
      expect(result).toBe(false);
    });

    it('should return false if cellIndex is invalid', async () => {
      const useInfernoData = {
        action: FirePUPActions.USE_INFERNO,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 1,
        cellIndex: -1,
      };
      const result = await firePUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useInfernoData
      );
      expect(result).toBe(false);
    });

    it('should reject and return true if consumePUP fails', async () => {
      (mockRoom.stateController.consumePUP as jest.Mock).mockReturnValue(false);
      const useInfernoData = {
        action: FirePUPActions.USE_INFERNO,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 1,
        cellIndex: 5,
      };
      const result = await firePUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useInfernoData
      );
      expect(result).toBe(true);
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        ProtocolActions.REJECT_ACTION,
        expect.objectContaining({ actionID: 42 }),
        expect.anything()
      );
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

      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).toHaveBeenCalledWith(
        FirePUPActions.METABOLIC_USED,
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
      const useMetabolicData = {
        action: FirePUPActions.USE_METABOLIC,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
      };
      const result = await firePUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useMetabolicData
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
