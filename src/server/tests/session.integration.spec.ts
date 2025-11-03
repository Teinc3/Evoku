/// <reference types="jest" />

import { jest } from '@jest/globals';


// Import all packets to register them in the packet registry
import '@shared/networking/packets';

import SessionActions from '@shared/types/enums/actions/system/session';
import MechanicsActions from '@shared/types/enums/actions/match/player/mechanics';
import PacketIO from '@shared/networking/utils/PacketIO';
import SessionModel from '../models/networking/Session';
import SessionManager from '../managers/SessionManager';

import type { WebSocket } from 'ws';
import type AugmentAction from '@shared/types/utils/AugmentAction';
import type SystemActions from '@shared/types/enums/actions/system';
import type IDataHandler from '../types/handler';


// --- Type-Safe Mock Classes ---
// A mock class for WebSocket that satisfies its type.
class MockWebSocket {
  close = jest.fn();
  send = jest.fn();
  removeAllListeners = jest.fn();
  on = jest.fn();
  ping = jest.fn();
  pong = jest.fn();
  terminate = jest.fn();
  binaryType = 'arraybuffer' as const;
  bufferedAmount = 0;
  extensions = '';
  isPaused = false;
  protocol = '';
  url = '';
  readyState = 1 as const; // WebSocket.OPEN
}

// A mock class for the system handler that implements the IDataHandler interface.
class MockSystemHandler implements IDataHandler<SystemActions> {
  handleData = jest.fn((_session: SessionModel, _data: AugmentAction<SystemActions>) => true);
}


describe('SessionManager and Session Integration Test', () => {
  let sessionManager: SessionManager;
  let mockSocket: WebSocket;
  let mockHandler: MockSystemHandler;

  beforeEach(() => {
    // Use fake timers to control setInterval and setTimeout
    jest.useFakeTimers();
    
    // Create new instances of our mocks for each test
    mockSocket = new MockWebSocket() as unknown as WebSocket;
    mockHandler = new MockSystemHandler();
    sessionManager = new SessionManager(mockHandler);
  });

  afterEach(() => {
    // Restore real timers after each test
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('should create a new session and store it', async () => {
    const session = sessionManager.createSession(mockSocket);
    
    expect(session).toBeInstanceOf(SessionModel);
    expect(sessionManager.getSession(session.uuid)).toBe(session);
  });

  it('should remove a session when it is destroyed', async () => {
    const session = sessionManager.createSession(mockSocket);
    const sessionId = session.uuid;
    
    // The session's onDestroy callback should trigger the manager to remove it
    session.destroy();
    
    expect(sessionManager.getSession(sessionId)).toBeUndefined();
  });

  describe('Cleanup Logic', () => {
    it('should disconnect an inactive socket after 30 seconds', async () => {
      const session = sessionManager.createSession(mockSocket);
      
      // Advance time by 40 seconds (30 seconds + 10 seconds max buffer + 1ms trigger)
      jest.advanceTimersByTime(40001);
      
      // The cleanup interval should have run and disconnected the socket
      expect(session.socketInstance).toBeNull();
      // Ensure the session itself is not yet destroyed
      expect(sessionManager.getSession(session.uuid)).toBe(session);
    });

    it('should destroy an inactive session after 2 minutes', async () => {
      const session = sessionManager.createSession(mockSocket);
      const sessionId = session.uuid;
      
      // Advance time by just over 2 minutes (120s + 10s + 1ms)
      jest.advanceTimersByTime(130001);
      
      // The cleanup interval should have run and destroyed the session completely
      expect(sessionManager.getSession(sessionId)).toBeUndefined();
    });

    it('should reset the inactivity timer when a packet is received', async () => {
      const session = sessionManager.createSession(mockSocket);
      await session.setAuthenticated('550e8400-e29b-41d4-a716-446655440010');
      const mockSocketInstance = mockSocket as unknown as MockWebSocket;
      // Get the message handler that was registered with ws.on('message', handler)
      const messageCalls = mockSocketInstance.on.mock.calls.filter(call => call[0] === 'message');
      const messageHandler = messageCalls[0][1] as (
        data: Buffer | ArrayBuffer | Buffer[] | string,
        isBinary: boolean
      ) => void;
      
      // Advance time by 25 seconds
      jest.advanceTimersByTime(25000);
      
      // Simulate a packet arriving by calling the message handler
      // First, we need to encode the packet data as the ServerSocket would
      const packetIO = new PacketIO();
      const encodedPacket = packetIO.encodePacket(SessionActions.HEARTBEAT, {});
      messageHandler(encodedPacket, true); // isBinary = true
      
      // Advance time by another 10 seconds (total 35 seconds)
      jest.advanceTimersByTime(10000);
      
      // The socket should NOT be disconnected because the timer was reset
      expect(session.socketInstance).not.toBeNull();
    });
  });

  describe('Piping Data to Handlers', () => {
    it('should forward data to the system handler after authentication', async () => {
      const session = sessionManager.createSession(mockSocket);
      await session.setAuthenticated('550e8400-e29b-41d4-a716-446655440011'); // Authenticate first
      const mockSocketInstance = mockSocket as unknown as MockWebSocket;
      // Get the message handler that was registered with ws.on('message', handler)
      const messageCalls = mockSocketInstance.on.mock.calls.filter(call => call[0] === 'message');
      const messageHandler = messageCalls[0][1] as (
        data: Buffer | ArrayBuffer | Buffer[] | string,
        isBinary: boolean
      ) => void;

      // Simulate receiving a heartbeat packet
      const packetIO = new PacketIO();
      const encodedPacket = packetIO.encodePacket(SessionActions.HEARTBEAT, {});
      messageHandler(encodedPacket, true); // isBinary = true

      // The system handler should have received the data
      expect(mockHandler.handleData).toHaveBeenCalledWith(
        session,
        expect.objectContaining({ action: SessionActions.HEARTBEAT })
      );

      // Now try to access the deepest handler in the chain (SessionHandler)
      // We can use tsignore to access private properties 
      // Actually we can't looks too complicated fuck it
    });

    it('should not have forwarded non-system data to the system handler', async () => {
      sessionManager.createSession(mockSocket);
      const mockSocketInstance = mockSocket as unknown as MockWebSocket;
      // Get the message handler that was registered with ws.on('message', handler)
      const messageCalls = mockSocketInstance.on.mock.calls.filter(call => call[0] === 'message');
      const messageHandler = messageCalls[0][1] as (
        data: Buffer | ArrayBuffer | Buffer[] | string,
        isBinary: boolean
      ) => void;

      const handlerSpy = jest.spyOn(mockHandler, 'handleData');

      // Simulate receiving a non-system packet
      const packetIO = new PacketIO();
      const encodedPacket = packetIO.encodePacket(MechanicsActions.DRAW_PUP, { 
        clientTime: 1000, 
        actionID: 123 
      });

      // Spy on the message handler
      const spiedMessageHandler = jest.fn(messageHandler);
      mockSocketInstance.on.mock.calls.find(call => call[0] === 'message')![1]
        = spiedMessageHandler;

      spiedMessageHandler(encodedPacket, true); // isBinary = true

      // Check if message handler was called
      expect(spiedMessageHandler).toHaveBeenCalled();

      // The system handler should not have been called
      expect(handlerSpy).not.toHaveBeenCalled();
    });
  });
});
