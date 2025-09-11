import { jest } from '@jest/globals';

import SessionModel from '../models/networking/Session';
import SessionManager from "./SessionManager";

import type { UUID } from 'crypto';
import type SystemActions from '@shared/types/enums/actions/system';
import type IDataHandler from '../types/handler';
import type ServerSocket from '../models/networking/ServerSocket';


// Type definitions for accessing private methods
interface SessionManagerPrivate {
  sessions: Map<UUID, SessionModel>;
  cleanupInterval: NodeJS.Timeout | null;
  cleanupSessions(): void;
}

// Mock classes for testing
class MockServerSocket {
  constructor(public readyState: number = 1) {} // WebSocket.OPEN = 1
  close = jest.fn();
  send = jest.fn();
  setListener = jest.fn();
  removeAllListeners = jest.fn();
  on = jest.fn();
}

class MockSystemHandler implements IDataHandler<SystemActions> {
  handleData = jest.fn<() => boolean>().mockReturnValue(true);
}

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockSystemHandler: MockSystemHandler;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockSystemHandler = new MockSystemHandler();
    sessionManager = new SessionManager(mockSystemHandler);
  });

  afterEach(() => {
    jest.useRealTimers();
    sessionManager.close();
  });

  describe('constructor', () => {
    it('should initialize with empty sessions map', () => {
      // Act & Assert
      expect((sessionManager as unknown as SessionManagerPrivate).sessions).toBeInstanceOf(Map);
      expect((sessionManager as unknown as SessionManagerPrivate).sessions.size).toBe(0);
    });

    it('should set up cleanup interval', () => {
      // Act & Assert
      expect((sessionManager as unknown as SessionManagerPrivate).cleanupInterval).not.toBeNull();
    });
  });

  describe('createSession', () => {
    it('should create and store a new session', () => {
      // Arrange
      const socket = new MockServerSocket();

      // Act
      const session = sessionManager.createSession(socket as unknown as ServerSocket);

      // Assert
      expect(session).toBeInstanceOf(SessionModel);
      expect((sessionManager as unknown as SessionManagerPrivate)
        .sessions.has(session.uuid)).toBe(true);
    });

    it('should pass correct parameters to SessionModel constructor', () => {
      // Arrange
      const socket = new MockServerSocket();

      // Act
      const session = sessionManager.createSession(socket as unknown as ServerSocket);

      // Assert
      expect(session.socketInstance).toBe(socket);
      expect(typeof session.uuid).toBe('string');
    });
  });

  describe('getSession', () => {
    it('should return session if it exists', () => {
      // Arrange
      const socket = new MockServerSocket();
      const session = sessionManager.createSession(socket as unknown as ServerSocket);

      // Act
      const retrieved = sessionManager.getSession(session.uuid);

      // Assert
      expect(retrieved).toBe(session);
    });

    it('should return undefined if session does not exist', () => {
      // Act
      const retrieved = sessionManager.getSession('nonexistent-uuid' as UUID);

      // Assert
      expect(retrieved).toBeUndefined();
    });
  });

  describe('onDisconnect', () => {
    it('should handle disconnection event', () => {
      // Arrange - Create a session using the manager so it's properly stored
      const socket = new MockServerSocket();
      const session = sessionManager.createSession(socket as unknown as ServerSocket);

      // Act
      sessionManager.onDisconnect(session);

      // Assert
      // Expect session to still remain in the sessions map for potential reconnection
      expect((sessionManager as unknown as SessionManagerPrivate)
        .sessions.has(session.uuid)).toBe(true);
    });
  });

  describe('onDestroy', () => {
    it('should remove session from sessions map', () => {
      // Arrange
      const socket = new MockServerSocket();
      const session = sessionManager.createSession(socket as unknown as ServerSocket);
      const sessionId = session.uuid;

      // Verify session exists
      expect((sessionManager as unknown as SessionManagerPrivate)
        .sessions.has(sessionId)).toBe(true);

      // Act
      sessionManager.onDestroy(session);

      // Assert
      expect((sessionManager as unknown as SessionManagerPrivate)
        .sessions.has(sessionId)).toBe(false);
    });
  });

  describe('cleanupSessions', () => {
    it('should destroy sessions inactive for more than 2 minutes', () => {
      // Arrange
      const socket = new MockServerSocket();
      const session = sessionManager.createSession(socket as unknown as ServerSocket);

      // Spy on the destroy method
      const destroySpy = jest.spyOn(session, 'destroy');

      // Simulate session being inactive for 2+ minutes
      const twoMinutesAgo = Date.now() - (2 * 60 * 1000) - 1000;
      (session as unknown as { lastActiveTime: number }).lastActiveTime = twoMinutesAgo;

      // Act
      const cleanupMethod = (sessionManager as unknown as SessionManagerPrivate)
        .cleanupSessions.bind(sessionManager);
      cleanupMethod();

      // Assert
      expect(destroySpy).toHaveBeenCalledWith(true);
    });

    it('should disconnect sockets for sessions inactive for more than 30 seconds', () => {
      // Arrange
      const socket = new MockServerSocket();
      const session = sessionManager.createSession(socket as unknown as ServerSocket);

      // Spy on the disconnect method
      const disconnectSpy = jest.spyOn(session, 'disconnect');

      // Simulate session being inactive for 30+ seconds but less than 2 minutes
      const thirtySecondsAgo = Date.now() - (30 * 1000) - 1000;
      (session as unknown as { lastActiveTime: number }).lastActiveTime = thirtySecondsAgo;

      // Act
      const cleanupMethod = (sessionManager as unknown as SessionManagerPrivate)
        .cleanupSessions.bind(sessionManager);
      cleanupMethod();

      // Assert
      expect(disconnectSpy).toHaveBeenCalledWith(true);
    });

    it('should not affect sessions that are recently active', () => {
      // Arrange
      const socket = new MockServerSocket();
      const session = sessionManager.createSession(socket as unknown as ServerSocket);

      // Spy on the methods
      const disconnectSpy = jest.spyOn(session, 'disconnect');
      const destroySpy = jest.spyOn(session, 'destroy');

      // Session is recently active (within 30 seconds)
      (session as unknown as { lastActiveTime: number }).lastActiveTime = Date.now();

      // Act
      const cleanupMethod = (sessionManager as unknown as SessionManagerPrivate)
        .cleanupSessions.bind(sessionManager);
      cleanupMethod();

      // Assert
      expect(disconnectSpy).not.toHaveBeenCalled();
      expect(destroySpy).not.toHaveBeenCalled();
    });

    it('should be called periodically by the cleanup timer', () => {
      // Arrange - Spy on the prototype method before creating the manager
      const cleanupSpy = jest.spyOn(
        SessionManager.prototype as unknown as SessionManagerPrivate,
        'cleanupSessions'
      );

      // Create manager after spying
      const freshManager = new SessionManager(mockSystemHandler);

      // Act
      jest.advanceTimersByTime(10 * 1000); // Advance 10 seconds

      // Assert
      expect(cleanupSpy).toHaveBeenCalled();

      // Clean up
      freshManager.close();
    });
  });

  describe('close', () => {
    it('should clear the cleanup interval', () => {
      // Act
      sessionManager.close();

      // Assert
      expect((sessionManager as unknown as SessionManagerPrivate).cleanupInterval).toBeNull();
    });

    it('should destroy all sessions', () => {
      // Arrange
      const socket1 = new MockServerSocket();
      const socket2 = new MockServerSocket();
      const session1 = sessionManager.createSession(socket1 as unknown as ServerSocket);
      const session2 = sessionManager.createSession(socket2 as unknown as ServerSocket);

      // Spy on the destroy methods
      const destroySpy1 = jest.spyOn(session1, 'destroy');
      const destroySpy2 = jest.spyOn(session2, 'destroy');

      // Act
      sessionManager.close();

      // Assert
      expect(destroySpy1).toHaveBeenCalledWith(true);
      expect(destroySpy2).toHaveBeenCalledWith(true);
    });

    it('should clear the sessions map', () => {
      // Arrange
      const socket = new MockServerSocket();
      sessionManager.createSession(socket as unknown as ServerSocket);

      // Act
      sessionManager.close();

      // Assert
      expect((sessionManager as unknown as SessionManagerPrivate).sessions.size).toBe(0);
    });
  });
});
