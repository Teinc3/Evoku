import { EventEmitter } from 'events';
import { jest } from '@jest/globals';

import WSCloseCode from '@shared/types/enums/ws-codes.enum';
import sharedConfig from '@shared/config';
import { SessionManager, RoomManager } from '../managers';
import WSServer from "./WSServer";

import type { Server as HttpServer } from 'http';


// --- Mock the dependencies ---

// We need to mock the entire 'ws' library.
// Add a mock 'close' function to the instance.
const mockWssInstance = new EventEmitter();
// @ts-expect-error (2339)
(mockWssInstance).close = jest.fn((callback: () => void) => callback());

jest.mock('ws', () => ({
  WebSocketServer: jest.fn(() => mockWssInstance),
}));

// Mock our internal classes. We want to spy on their methods.
const mockSessionManager = {
  setMatchmakingManager: jest.fn(),
  createSession: jest.fn(),
  close: jest.fn(),
};

jest.mock('../managers', () => ({
  SessionManager: jest.fn(() => mockSessionManager),
  RoomManager: jest.fn(() => ({ close: jest.fn() })),
  MatchmakingManager: jest.fn(() => ({ close: jest.fn() })),
}));
jest.mock('../models/networking/serversocket');
jest.mock('../services/redis', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    set: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    get: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
    keys: jest.fn<() => Promise<string[]>>().mockResolvedValue([]),
  },
}));

describe('WSServer Integration Test', () => {
  let httpServer: HttpServer;
  let wsServer: WSServer;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
  })

  beforeEach(() => {
    // Clear all mock history before each test
    jest.clearAllMocks();
    
    // Create a mock http.Server instance. We don't need a real one.
    httpServer = new EventEmitter() as HttpServer;
    
    // Instantiate our WSServer, which will in turn instantiate the mocked dependencies
    wsServer = new WSServer(httpServer);
  });

  // Add this afterEach block to clean up after every test
  afterEach(() => {
    // This removes the leaking event listeners, fixing the "called twice" bug.
    mockWssInstance.removeAllListeners();
    // This closes the setInterval handles, fixing the "Jest did not exit" issue.
    wsServer.close();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('should initialize required services and attach to httpserver on construction', () => {
    // Assert that the WebSocketServer from the 'ws' library was created
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebSocketServer } = require('ws');
    expect(WebSocketServer).toHaveBeenCalledTimes(1);
    expect(WebSocketServer).toHaveBeenCalledWith(expect.objectContaining({
      server: httpServer,
      handleProtocols: expect.any(Function),
    }));

    // Assert that our internal managers were instantiated by the WSServer constructor
    expect(SessionManager).toHaveBeenCalledTimes(1);
    expect(RoomManager).toHaveBeenCalledTimes(1);
  });

  it('should negotiate the configured subprotocol and reject others', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { WebSocketServer } = require('ws') as {
      WebSocketServer: jest.Mock;
    };

    const options = WebSocketServer.mock.calls[0][0] as {
      handleProtocols: (protocols: Set<string>) => string | false;
    };

    const expectedProtocol = sharedConfig.networking.ws.protocol;
    expect(options.handleProtocols(new Set([expectedProtocol]))).toBe(expectedProtocol);
    expect(options.handleProtocols(new Set(['some-other-protocol']))).toBe(false);
  });

  it('should create a new session when a client connects with correct protocol', () => {
    // Spy on the mock session manager's createSession method
    const createSessionSpy = jest.spyOn(mockSessionManager, 'createSession');
    
    // Simulate a new client connecting by manually emitting the 'connection' event
    const mockClientSocket = {
      protocol: sharedConfig.networking.ws.protocol,
    }; // A simple object to represent the client connection
    mockWssInstance.emit('connection', mockClientSocket);

    // Assert that the SessionManager was told to create a new session
    expect(createSessionSpy).toHaveBeenCalledTimes(1);
    expect(createSessionSpy).toHaveBeenCalledWith(mockClientSocket);
  });

  it('should close the connection and not create a session when protocol is wrong', () => {
    const createSessionSpy = jest.spyOn(mockSessionManager, 'createSession');
    const closeSpy = jest.fn();

    const mockClientSocket = {
      protocol: 'wrong-protocol',
      close: closeSpy,
    };

    mockWssInstance.emit('connection', mockClientSocket);

    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(closeSpy).toHaveBeenCalledWith(WSCloseCode.PROTOCOL_ERROR);
    expect(createSessionSpy).not.toHaveBeenCalled();
  });
});
