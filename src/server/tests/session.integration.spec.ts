import { jest } from '@jest/globals';

import SessionActions from '@shared/types/enums/actions/system/session';
import SessionManager from '../managers/SessionManager';
import SessionModel from '../models/Session';

import type { WebSocket } from 'ws';
import type IDataContract from '@shared/types/contracts/components/base/IDataContract';
import type SystemActions from '@shared/types/enums/actions/system';
import type PacketIO from '@shared/networking/utils/PacketIO';
import type ServerSocket from '../models/ServerSocket';
import type IDataHandler from '../types/handler';

// --- Type-Safe Mock Classes ---

// A mock class for ServerSocket that satisfies its type.
class MockServerSocket {
  close = jest.fn();
  setListener = jest.fn();
  send = jest.fn();
  forward = jest.fn();
  readyState = 1 as const; // WebSocket.OPEN
  packetIO = {} as PacketIO; // Not used in this test
  ws = {} as WebSocket;     // Not used in this test
}

// A mock class for the system handler that implements the IDataHandler interface.
class MockSystemHandler implements IDataHandler<SystemActions> {
  handleData = jest.fn(() => true);
}


describe('SessionManager and Session Integration Test', () => {
  let sessionManager: SessionManager;
  let mockSocket: ServerSocket;
  let mockHandler: MockSystemHandler;

  beforeEach(() => {
    // Use fake timers to control setInterval and setTimeout
    jest.useFakeTimers();
    
    // Create new instances of our mocks for each test
    mockSocket = new MockServerSocket() as unknown as ServerSocket;
    mockHandler = new MockSystemHandler();
    
    // The constructor is now fully type-safe, no 'as any' needed.
    sessionManager = new SessionManager(mockHandler);
  });

  afterEach(() => {
    // Restore real timers after each test
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should create a new session and store it', () => {
    const session = sessionManager.createSession(mockSocket);
    
    expect(session).toBeInstanceOf(SessionModel);
    expect(sessionManager.getSession(session.uuid)).toBe(session);
  });

  it('should remove a session when it is destroyed', () => {
    const session = sessionManager.createSession(mockSocket);
    const sessionId = session.uuid;
    
    // The session's onDestroy callback should trigger the manager to remove it
    session.destroy();
    
    expect(sessionManager.getSession(sessionId)).toBeUndefined();
  });

  describe('Cleanup Logic', () => {
    it('should disconnect an inactive socket after 30 seconds', () => {
      const session = sessionManager.createSession(mockSocket);
      
      // Advance time by 40 seconds (30 seconds + 10 seconds max buffer + 1ms trigger)
      jest.advanceTimersByTime(40001);
      
      // The cleanup interval should have run and disconnected the socket
      expect(session.socketInstance).toBeNull();
      // Ensure the session itself is not yet destroyed
      expect(sessionManager.getSession(session.uuid)).toBe(session);
    });

    it('should destroy an inactive session after 2 minutes', () => {
      const session = sessionManager.createSession(mockSocket);
      const sessionId = session.uuid;
      
      // Advance time by just over 2 minutes (120s + 10s + 1ms)
      jest.advanceTimersByTime(130001);
      
      // The cleanup interval should have run and destroyed the session completely
      expect(sessionManager.getSession(sessionId)).toBeUndefined();
    });

    it('should reset the inactivity timer when a packet is received', () => {
      const session = sessionManager.createSession(mockSocket);
      const dataListener = (mockSocket as unknown as MockServerSocket)
        .setListener.mock.calls[0][0] as (data: IDataContract) => void;
      
      // Advance time by 25 seconds
      jest.advanceTimersByTime(25000);
      
      // Simulate a packet arriving, which should reset the lastActiveTime
      dataListener({ action: SessionActions.HEARTBEAT }); // A system action to trigger the update
      
      // Advance time by another 10 seconds (total 35 seconds)
      jest.advanceTimersByTime(10000);
      
      // The socket should NOT be disconnected because the timer was reset
      expect(session.socketInstance).not.toBeNull();
    });
  });
});
