import { EventEmitter } from 'events';
import { jest } from '@jest/globals';

import SessionManager from '../managers/SessionManager';
import RoomManager from '../managers/RoomManager';
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
jest.mock('../managers/SessionManager');
jest.mock('../managers/RoomManager');
jest.mock('../models/networking/ServerSocket');
jest.mock('../services/RedisService', () => ({
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
    expect(WebSocketServer).toHaveBeenCalledWith({ server: httpServer });

    // Assert that our internal managers were instantiated by the WSServer constructor
    expect(SessionManager).toHaveBeenCalledTimes(1);
    expect(RoomManager).toHaveBeenCalledTimes(1);
  });

  it('should create a new ServerSocket and a new Session when a client connects', () => {
    // Get a reference to the mock SessionManager instance that WSServer created
    const sessionManagerInstance
      = (SessionManager as jest.Mock).mock.instances[0] as SessionManager;
    const createSessionSpy = jest.spyOn(sessionManagerInstance, 'createSession');
    
    // Simulate a new client connecting by manually emitting the 'connection' event
    const mockClientSocket = {}; // A simple object to represent the client connection
    mockWssInstance.emit('connection', mockClientSocket);

    // Assert that the SessionManager was told to create a new session
    expect(createSessionSpy).toHaveBeenCalledTimes(1);
    expect(createSessionSpy).toHaveBeenCalledWith(mockClientSocket);
  });
});
