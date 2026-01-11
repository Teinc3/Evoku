import { jest } from '@jest/globals';

import MatchStatus from '@shared/types/enums/matchstatus';
import EarthPUPActions from '@shared/types/enums/actions/match/player/powerups/earth';
import { ProtocolActions } from '@shared/types/enums/actions';
import EarthPUPHandler from "./EarthPUPHandler";

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

describe('EarthPUPHandler', () => {
  let earthPUPHandler: EarthPUPHandler;
  let mockRoom: MockRoom;
  let mockSession: MockSession;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom = new MockRoom('test-room');
    mockSession = new MockSession('test-session');
    earthPUPHandler = new EarthPUPHandler(mockRoom as unknown as RoomModel);
  });

  describe('handleUseLandslide', () => {
    it('should handle USE_LANDSLIDE action and return true', async () => {
      // Arrange
      const useLandslideData = {
        action: EarthPUPActions.USE_LANDSLIDE,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 1,
        cellIndex: 5,
      };

      // Act
      const result = await earthPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useLandslideData
      );

      // Assert
      expect(result).toBe(true);

      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).toHaveBeenCalledWith(
        EarthPUPActions.LANDSLIDE_USED,
        expect.objectContaining({
          actionID: 42,
          pupID: 1,
          targetID: 1,
          playerID: 0,
          serverTime: 1234,
        })
      );

      expect(
        mockRoom.stateController.setPUPPendingEffect
      ).toHaveBeenCalledWith(
        0,
        1,
        expect.objectContaining({
          targetID: 1,
          cellIndex: expect.any(Number),
          serverTimeoutID: 999,
        })
      );

      expect(mockRoom.setTrackedTimeout).toHaveBeenCalledWith(expect.any(Function), 5000);
    });

    it('should return false if targetID is invalid', async () => {
      const useLandslideData = {
        action: EarthPUPActions.USE_LANDSLIDE,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 0, // Same as playerID (0)
        cellIndex: 5,
      };
      const result = await earthPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useLandslideData
      );
      expect(result).toBe(false);
    });

    it('should reject and return true if consumePUP fails', async () => {
      (mockRoom.stateController.consumePUP as jest.Mock).mockReturnValue(false);
      const useLandslideData = {
        action: EarthPUPActions.USE_LANDSLIDE,
        actionID: 42,
        pupID: 1,
        clientTime: 1000,
        targetID: 1,
        cellIndex: 5,
      };
      const result = await earthPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useLandslideData
      );
      expect(result).toBe(true);
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        ProtocolActions.REJECT_ACTION,
        expect.objectContaining({ actionID: 42 }),
        expect.anything()
      );
    });
  });

  describe('handleUseExcavate', () => {
    it('should handle USE_EXCAVATE action and return true', async () => {
      // Arrange
      const useExcavateData = {
        action: EarthPUPActions.USE_EXCAVATE,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
        cellIndex: 7,
      };

      // Act
      const result = await earthPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useExcavateData
      );

      // Assert
      expect(result).toBe(true);

      expect((mockRoom as unknown as { broadcast: jest.Mock }).broadcast).toHaveBeenCalledWith(
        EarthPUPActions.EXCAVATE_USED,
        expect.objectContaining({
          actionID: 43,
          pupID: 2,
          cellIndex: 7,
          playerID: 0,
          serverTime: 1234,
        })
      );
    });

    it('should return false if cellIndex is invalid', async () => {
      const useExcavateData = {
        action: EarthPUPActions.USE_EXCAVATE,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
        cellIndex: -1,
      };
      const result = await earthPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useExcavateData
      );
      expect(result).toBe(false);
    });

    it('should reject and return true if consumePUP fails', async () => {
      (mockRoom.stateController.consumePUP as jest.Mock).mockReturnValue(false);
      const useExcavateData = {
        action: EarthPUPActions.USE_EXCAVATE,
        actionID: 43,
        pupID: 2,
        clientTime: 1000,
        cellIndex: 7,
      };
      const result = await earthPUPHandler.handleData(
        mockSession as unknown as SessionModel,
        useExcavateData
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
