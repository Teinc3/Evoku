import { jest } from '@jest/globals';

import SessionActions from '@shared/types/enums/actions/system/session';
import LobbyActions from '@shared/types/enums/actions/system/lobby';
import FirePUPActions from '@shared/types/enums/actions/match/player/powerups/fire';
import SystemHandler from '../handlers/system';
import MatchHandler from '../handlers/match';

import type SessionModel from '../models/networking/Session';
import type RoomModel from '../models/networking/Room';
import type { MatchmakingManager } from '../managers';
import type SessionHandler from '../handlers/system/SessionHandler';
import type LobbyHandler from '../handlers/system/LobbyHandler';
import type FirePUPHandler from '../handlers/match/player/powerups/FirePUPHandler';
import type PUPHandler from '../handlers/match/player/powerups';
import type PlayerHandler from '../handlers/match/player';


// A simple mock for the SessionModel
class MockSession {
  constructor(public readonly uuid: string) {}
  // Add any other properties or methods the handlers might need
  send = jest.fn();
  forward = jest.fn();
  isAuthenticated = jest.fn().mockReturnValue(true);
}

class MockMatchmakingManager {
  joinQueue = jest.fn();
  leaveQueue = jest.fn();
}

class MockRoom {
  constructor(public readonly roomID: string) {}
}


describe('System Handler Integration Test', () => {
  let mockSession: SessionModel;
  let systemHandler: SystemHandler;
  let sessionHandler: SessionHandler;
  let lobbyHandler: LobbyHandler;
  let mockMatchmakingManager: MockMatchmakingManager;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = new MockSession('mock-uuid-123') as unknown as SessionModel;
    mockMatchmakingManager = new MockMatchmakingManager();

    systemHandler = new SystemHandler();
    systemHandler.setMatchmakingManager(mockMatchmakingManager as unknown as MatchmakingManager);
    // @ts-expect-error ts(2341) - Accessing private property for test purposes
    sessionHandler = systemHandler.handlerMap[0][1];
    // @ts-expect-error ts(2341)
    lobbyHandler = systemHandler.handlerMap[1][1];
  });

  it('should correctly route a LobbyAction to the LobbyHandler', async () => {
    // A. Create a mock packet for a lobby action
    const joinQueuePacket = {
      action: LobbyActions.JOIN_QUEUE,
      username: 'TestPlayer',
    }
    
    // B. Spy on the CHILD HANDLER'S main entry point, not the specific method
    const lobbyHandlerSpy = jest.spyOn(lobbyHandler, 'handleData');

    // C. Pass the packet to the top-level SystemHandler
    const result = await systemHandler.handleData(mockSession, joinQueuePacket);

    // D. Assertions
    expect(result).toBe(true);
    // Assert that the packet was correctly routed to the LobbyHandler
    expect(lobbyHandlerSpy).toHaveBeenCalledTimes(1);
    expect(lobbyHandlerSpy).toHaveBeenCalledWith(mockSession, joinQueuePacket);
  });

  it('should correctly route a SessionAction to the SessionHandler', async () => {
    // A. Create a mock packet for a session action
    const heartbeatPacket = {
      action: SessionActions.HEARTBEAT,
    };

    // B. Spy on the CHILD HANDLER'S main entry point
    const sessionHandlerSpy = jest.spyOn(sessionHandler, 'handleData');

    // C. Pass the packet to the top-level SystemHandler
    const result = await systemHandler.handleData(mockSession, heartbeatPacket);

    // D. Assertions
    expect(result).toBe(true);
    expect(sessionHandlerSpy).toHaveBeenCalledWith(mockSession, heartbeatPacket);
  });

  it('should return false for an unhandled action', async () => {
    // A. Create a packet with an action that SystemHandler does not handle
    const unhandledPacket = {
      action: 127, // Some action not in SystemActions
    };

    // B. Pass the packet to the handler
    const result = await systemHandler.handleData(mockSession, unhandledPacket);

    // C. Assertions
    expect(result).toBe(false);
  });
});


describe('Match Handler Integration Test', () => {
  let matchHandler: MatchHandler;
  let mockRoom: RoomModel
  let mockSession: SessionModel;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRoom = new MockRoom('69420') as unknown as RoomModel;
    mockSession = new MockSession('mock-uuid-123') as unknown as SessionModel;
    matchHandler = new MatchHandler(mockRoom);
  });

  it('should route an action through multiple UnionHandlers properly', async () => {
    // We want to test the full chain: MatchHandler -> PlayerHandler -> PUPHandler -> FirePUPHandler
    // To do this, we spy on the final handler in the chain.
    // @ts-expect-error ts(2341)
    const playerHandler = matchHandler.handlerMap[1][1] as PlayerHandler
    // @ts-expect-error ts(2341)
    const pupHandler = playerHandler.handlerMap[1][1] as PUPHandler
    // @ts-expect-error ts(2341)
    const firePUPHandler = pupHandler.handlerMap[0][1] as FirePUPHandler

    // Spy on the handleData method of the DEEPEST handler
    const firePUPHandlerSpy = jest.spyOn(firePUPHandler, 'handleData');

    // Create a mock packet for a FirePUP action
    const useInfernoPacket = {
      action: FirePUPActions.USE_INFERNO,
      actionID: 5,
      pupID: 6942,
      clientTime: 1424,
      targetID: 1,
      cellIndex: 42
    }

    // Pass the packet to the TOP-LEVEL MatchHandler
    const result = await matchHandler.handleData(mockSession, useInfernoPacket);

    // Assertions
    expect(result).toBe(true);
    // Assert that the packet was correctly routed all the way down to the FirePUPHandler
    expect(firePUPHandlerSpy).toHaveBeenCalledTimes(1);
    expect(firePUPHandlerSpy).toHaveBeenCalledWith(mockSession, useInfernoPacket);
  });

  it('should return false for an unhandled action', async () => {
    // Create a packet with an action that MatchHandler does not handle
    const unhandledPacket = {
      action: -128 // Some action not in MatchActions
    };

    // Pass the packet to the handler
    // @ts-expect-error ts(2345)
    const result = await matchHandler.handleData(mockSession, unhandledPacket);

    // Assertions
    expect(result).toBe(false);
  });

});
