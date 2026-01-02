import { jest } from '@jest/globals';

import { ProtocolActions, MechanicsActions } from '@shared/types/enums/actions';
import sharedConfig from '@shared/config';
import MechanicsHandler from "./MechanicsHandler";

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type { RoomModel } from '../../../models/networking';
import type { SessionModel } from '../../../models/networking';


// Mock classes for testing
class MockSession {
  constructor(public readonly uuid: string) {}
  send = jest.fn();
  forward = jest.fn();
}

class MockStateController {
  setCellValue = jest.fn();
  computeHash = jest.fn();
  reservePUPDraw = jest.fn<(playerID: number) => number>();
  drawRandomPUP = jest.fn<(
    playerID: number,
    slotIndex: number
  ) => {
    pupID: number;
    type: number;
    level: number;
    slotIndex: number;
  } | null>();
}

class MockRoom {
  constructor(public readonly roomID: string) {}
  stateController = new MockStateController();
  getPlayerID = jest.fn<(session: SessionModel) => number | undefined>();
  broadcast = jest.fn();
  getSessionIDFromPlayerID = jest.fn<(playerID: number) => string | undefined>();
  participants = new Map<string, MockSession>();
  setTrackedTimeout = jest.fn<(cb: () => void, delayMs: number) => ReturnType<typeof setTimeout>>(
    (cb: () => void, delayMs: number) => {
      return setTimeout(cb, delayMs);
    },
  );
}

describe('MechanicsHandler', () => {
  let mechanicsHandler: MechanicsHandler;
  let mockRoom: MockRoom;
  let mockSession: MockSession;
  let mockStateController: MockStateController;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom = new MockRoom('test-room');
    mockSession = new MockSession('test-session');
    mockStateController = mockRoom.stateController;
    mechanicsHandler = new MechanicsHandler(mockRoom as unknown as RoomModel);
  });

  describe('handleSetCell', () => {
    it('should handle SET_CELL action successfully and broadcast CELL_SET', async () => {
      // Arrange
      const playerID = 1;
      const serverTime = 1005;
      const setCellData: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        actionID: 42,
        cellIndex: 5,
        value: 2, 
        clientTime: 1000,
      };

      mockRoom.getPlayerID.mockReturnValue(playerID);
      mockStateController.setCellValue.mockReturnValue({
        result: true,
        serverTime,
      });

      // Act
      const result = await mechanicsHandler.handleData(
        mockSession as unknown as SessionModel, 
        setCellData
      );

      // Assert
      expect(result).toBe(true);
      expect(mockRoom.getPlayerID).toHaveBeenCalledWith(mockSession as unknown as SessionModel);
      const { action: _, ...payload } = setCellData;
      expect(mockStateController.setCellValue).toHaveBeenCalledWith(playerID, payload);
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        MechanicsActions.CELL_SET,
        {
          serverTime,
          playerID,
          ...payload,
        }
      );
      expect(mockRoom.broadcast).toHaveBeenCalledTimes(1);
    });

    it('should handle SET_CELL action failure and broadcast REJECT_ACTION', async () => {
      // Arrange
      const playerID = 1;
      const gameStateHash = 12345; // Using number instead of string 'hash123'
      const setCellData: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        actionID: 42,
        cellIndex: 5,
        value: 2, 
        clientTime: 1000,
      };

      mockRoom.getPlayerID.mockReturnValue(playerID);
      mockStateController.setCellValue.mockReturnValue({
        result: false,
        serverTime: undefined,
      });
      mockStateController.computeHash.mockReturnValue(gameStateHash);

      // Act
      const result = await mechanicsHandler.handleData(
        mockSession as unknown as SessionModel, 
        setCellData
      );

      // Assert
      // NOTE: Could be due to race conditions with another player
      // In this case, we still tolerate this move and don't disconnect yet.
      expect(result).toBe(true);
      expect(mockRoom.getPlayerID).toHaveBeenCalledWith(mockSession as unknown as SessionModel);
      const { action: _, ...payload } = setCellData;
      expect(mockStateController.setCellValue).toHaveBeenCalledWith(playerID, payload);
      expect(mockStateController.computeHash).toHaveBeenCalled();
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        ProtocolActions.REJECT_ACTION,
        {
          actionID: setCellData.actionID,
          gameStateHash,
        },
        { to: [mockSession.uuid] }
      );
      expect(mockRoom.broadcast).toHaveBeenCalledTimes(1);
    });

    it('should return false when session is not found in room', async () => {
      // Arrange
      const setCellData: AugmentAction<MechanicsActions.SET_CELL> = {
        action: MechanicsActions.SET_CELL,
        actionID: 42,
        cellIndex: 5,
        value: 2, 
        clientTime: 1000,
      };

      mockRoom.getPlayerID.mockReturnValue(undefined);

      // Act
      const result = await mechanicsHandler.handleData(
        mockSession as unknown as SessionModel, 
        setCellData
      );

      // Assert
      expect(result).toBe(false);
      expect(mockRoom.getPlayerID).toHaveBeenCalledWith(mockSession as unknown as SessionModel);
      expect(mockStateController.setCellValue).not.toHaveBeenCalled();
      expect(mockRoom.broadcast).not.toHaveBeenCalled();
    });
  });

  describe('handleDrawPUP', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return false when draw cannot be reserved', async () => {
      const playerID = 1;
      const drawPUPData: AugmentAction<MechanicsActions.DRAW_PUP> = {
        action: MechanicsActions.DRAW_PUP
      };

      mockRoom.getPlayerID.mockReturnValue(playerID);
      mockStateController.reservePUPDraw.mockReturnValue(-1);

      const result = await mechanicsHandler.handleData(
        mockSession as unknown as SessionModel,
        drawPUPData
      );

      expect(result).toBe(false);
      expect(mockStateController.reservePUPDraw).toHaveBeenCalledWith(playerID);
      expect(mockStateController.drawRandomPUP).not.toHaveBeenCalled();
      expect(mockRoom.broadcast).not.toHaveBeenCalledWith(
        MechanicsActions.PUP_DRAWN,
        expect.anything()
      );
    });

    it('should return false when session has no playerID', async () => {
      const drawPUPData: AugmentAction<MechanicsActions.DRAW_PUP> = {
        action: MechanicsActions.DRAW_PUP
      };

      mockRoom.getPlayerID.mockReturnValue(undefined);

      const result = await mechanicsHandler.handleData(
        mockSession as unknown as SessionModel,
        drawPUPData
      );

      expect(result).toBe(false);
      expect(mockStateController.reservePUPDraw).not.toHaveBeenCalled();
    });

    it('should schedule a delayed draw and broadcast PUP_DRAWN', async () => {
      const playerID = 1;
      const reservedSlotIndex = 2;
      const drawPUPData: AugmentAction<MechanicsActions.DRAW_PUP> = {
        action: MechanicsActions.DRAW_PUP
      };

      mockRoom.getPlayerID.mockReturnValue(playerID);
      mockRoom.getSessionIDFromPlayerID.mockReturnValue(mockSession.uuid);
      mockRoom.participants.set(mockSession.uuid, mockSession);
      mockStateController.reservePUPDraw.mockReturnValue(reservedSlotIndex);
      mockStateController.drawRandomPUP.mockReturnValue({
        pupID: 5,
        type: 7,
        level: 1,
        slotIndex: reservedSlotIndex,
      });

      const result = await mechanicsHandler.handleData(
        mockSession as unknown as SessionModel,
        drawPUPData
      );

      expect(result).toBe(true);
      expect(mockStateController.reservePUPDraw).toHaveBeenCalledWith(playerID);

      expect(mockRoom.setTrackedTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        sharedConfig.game.powerups.drawSettleDelayMs,
      );

      jest.advanceTimersByTime(sharedConfig.game.powerups.drawSettleDelayMs);

      expect(mockStateController.drawRandomPUP).toHaveBeenCalledWith(
        playerID,
        reservedSlotIndex,
        expect.any(Number)
      );
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        MechanicsActions.PUP_DRAWN,
        {
          playerID,
          pupID: 5,
          type: 7,
          level: 1,
          slotIndex: reservedSlotIndex
        }
      );
    });

    it('should allow scheduling multiple draws (if controller allows)', async () => {
      const playerID = 1;
      const drawPUPData: AugmentAction<MechanicsActions.DRAW_PUP> = {
        action: MechanicsActions.DRAW_PUP
      };

      mockRoom.getPlayerID.mockReturnValue(playerID);
      mockRoom.getSessionIDFromPlayerID.mockReturnValue(mockSession.uuid);
      mockRoom.participants.set(mockSession.uuid, mockSession);
      mockStateController.reservePUPDraw
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(1);
      mockStateController.drawRandomPUP
        .mockReturnValueOnce({
          pupID: 5,
          type: 7,
          level: 1,
          slotIndex: 0,
        })
        .mockReturnValueOnce({
          pupID: 6,
          type: 8,
          level: 1,
          slotIndex: 1,
        });

      const first = await mechanicsHandler.handleData(
        mockSession as unknown as SessionModel,
        drawPUPData
      );
      const second = await mechanicsHandler.handleData(
        mockSession as unknown as SessionModel,
        drawPUPData
      );

      expect(first).toBe(true);
      expect(second).toBe(true);

      jest.advanceTimersByTime(sharedConfig.game.powerups.drawSettleDelayMs);

      expect(mockStateController.drawRandomPUP).toHaveBeenCalledWith(
        playerID,
        0,
        expect.any(Number)
      );
      expect(mockStateController.drawRandomPUP).toHaveBeenCalledWith(
        playerID,
        1,
        expect.any(Number)
      );
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        MechanicsActions.PUP_DRAWN,
        {
          playerID,
          pupID: 5,
          type: 7,
          level: 1,
          slotIndex: 0
        }
      );
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        MechanicsActions.PUP_DRAWN,
        {
          playerID,
          pupID: 6,
          type: 8,
          level: 1,
          slotIndex: 1
        }
      );
    });

    it('should not broadcast PUP_DRAWN when drawRandomPUP returns null', async () => {
      const playerID = 1;
      const reservedSlotIndex = 0;
      const drawPUPData: AugmentAction<MechanicsActions.DRAW_PUP> = {
        action: MechanicsActions.DRAW_PUP
      };

      mockRoom.getPlayerID.mockReturnValue(playerID);
      mockStateController.reservePUPDraw.mockReturnValue(reservedSlotIndex);
      mockStateController.drawRandomPUP.mockReturnValue(null);

      const result = await mechanicsHandler.handleData(
        mockSession as unknown as SessionModel,
        drawPUPData
      );

      expect(result).toBe(true);

      jest.advanceTimersByTime(sharedConfig.game.powerups.drawSettleDelayMs);

      expect(mockRoom.broadcast).not.toHaveBeenCalledWith(
        MechanicsActions.PUP_DRAWN,
        expect.anything()
      );
    });
  });
});
