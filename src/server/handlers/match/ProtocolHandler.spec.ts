import { jest } from '@jest/globals';

import ProtocolActions from '@shared/types/enums/actions/match/protocol';
import ProtocolHandler from "./ProtocolHandler";

import type AugmentAction from '@shared/types/utils/AugmentAction';
import type SessionModel from '../../models/networking/Session';
import type RoomModel from '../../models/networking/Room';


// Mock classes for testing
class MockSession {
  constructor(public readonly uuid: string) {}
  send = jest.fn();
  forward = jest.fn();
}

class MockTimeService {
  handlePong = jest.fn();
}

class MockRoom {
  constructor(public readonly roomID: string) {}
  timeService = new MockTimeService();
  getPlayerID = jest.fn<(session: SessionModel) => number | undefined>();
  broadcast = jest.fn();
}

describe('ProtocolHandler', () => {
  let protocolHandler: ProtocolHandler;
  let mockRoom: MockRoom;
  let mockSession: MockSession;
  let mockTimeService: MockTimeService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom = new MockRoom('test-room');
    mockSession = new MockSession('test-session');
    mockTimeService = mockRoom.timeService;
    protocolHandler = new ProtocolHandler(mockRoom as unknown as RoomModel);
  });

  describe('handlePong', () => {
    it('should handle PONG action successfully when session is found in room', async () => {
      // Arrange
      const playerID = 1;
      const clientTime = 1000;
      const serverTime = 1005;
      const pongPacket = {
        action: ProtocolActions.PONG,
        clientTime,
        serverTime,
      };

      mockRoom.getPlayerID.mockReturnValue(playerID);

      // Act
      const result = await protocolHandler.handleData(
        mockSession as unknown as SessionModel, 
        pongPacket
      );

      // Assert
      expect(result).toBe(true);
      expect(mockRoom.getPlayerID).toHaveBeenCalledWith(mockSession as unknown as SessionModel);
      expect(mockTimeService.handlePong).toHaveBeenCalledWith(playerID, clientTime, serverTime);
    });

    it('should return false when session is not found in room', async () => {
      // Arrange
      const pongPacket: AugmentAction<ProtocolActions.PONG> = {
        action: ProtocolActions.PONG,
        clientTime: 1000,
        serverTime: 1005,
      };

      mockRoom.getPlayerID.mockReturnValue(undefined);

      // Act
      const result = await protocolHandler.handleData(
        mockSession as unknown as SessionModel, 
        pongPacket
      );

      // Assert
      expect(result).toBe(false);
      expect(mockRoom.getPlayerID).toHaveBeenCalledWith(mockSession as unknown as SessionModel);
      expect(mockTimeService.handlePong).not.toHaveBeenCalled();
    });
  });
});
