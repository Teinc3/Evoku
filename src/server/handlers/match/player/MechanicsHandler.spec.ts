import { jest } from '@jest/globals';

import { ProtocolActions, MechanicsActions } from '@shared/types/enums/actions';
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
}

class MockRoom {
  constructor(public readonly roomID: string) {}
  stateController = new MockStateController();
  getPlayerID = jest.fn<(session: SessionModel) => number | undefined>();
  broadcast = jest.fn();
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
      expect(mockStateController.setCellValue).toHaveBeenCalledWith(playerID, setCellData);
      expect(mockRoom.broadcast).toHaveBeenCalledWith(
        MechanicsActions.CELL_SET,
        {
          serverTime,
          playerID,
          ...setCellData,
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
      expect(result).toBe(false);
      expect(mockRoom.getPlayerID).toHaveBeenCalledWith(mockSession as unknown as SessionModel);
      expect(mockStateController.setCellValue).toHaveBeenCalledWith(playerID, setCellData);
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
    it('should handle DRAW_PUP action and return true', async () => {
      // Arrange
      const drawPUPData: AugmentAction<MechanicsActions.DRAW_PUP> = {
        action: MechanicsActions.DRAW_PUP,
        actionID: 43,
        clientTime: 1000,
      };

      // Act
      const result = await mechanicsHandler.handleData(
        mockSession as unknown as SessionModel, 
        drawPUPData
      );

      // Assert
      expect(result).toBe(true);
    });
  });
});
