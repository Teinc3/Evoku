import fs from 'node:fs';
import { createServer } from 'http';
import express from 'express';
import { jest } from '@jest/globals';

import statsService from '../services/StatsService';
import HTTPServer from './HTTPServer';

import type WSServer from './WSServer';


// Mock config first before any other imports
jest.mock('../config/index', () => ({
  default: {
    networking: { port: 8080 },
    redis: { host: 'localhost', port: 6379 }
  }
}));

// Mock other dependencies
jest.mock('express');
jest.mock('http');
jest.mock('../services/StatsService');
jest.mock('../services/RedisService');

// Mock process.exit to prevent test suite from exiting
jest.spyOn(process, 'exit').mockImplementation(() => {
  throw new Error('process.exit() was called');
});

// Mock console methods to prevent test output pollution
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

// Mock the path module
jest.mock('node:path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
}));

// Mock the fs module
jest.mock('node:fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
}));

// Mock express
const mockExpress = jest.fn(() => ({
  use: jest.fn(),
  get: jest.fn(),
  post: jest.fn(),
  all: jest.fn(),
  listen: jest.fn(),
  static: jest.fn(),
}));

// Mock http server
const mockServer = {
  listen: jest.fn(),
  close: jest.fn(),
} as jest.Mocked<{
  listen: jest.Mock;
  close: jest.Mock;
}>;

describe('HTTPServer', () => {
  let httpServer: HTTPServer;
  let mockWsServer: jest.Mocked<WSServer>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset mocks
    (express as unknown as jest.Mock).mockImplementation(mockExpress);
    (createServer as jest.Mock).mockReturnValue(mockServer);

    // Create server instance
    httpServer = new HTTPServer(8745);
    mockWsServer = {} as jest.Mocked<WSServer>;
  });

  describe('constructor', () => {
    it('should initialize with correct port and create express app and server', () => {
      // Assert
      expect(express).toHaveBeenCalled();
      expect(createServer).toHaveBeenCalled();
      expect(httpServer.app).toBeDefined();
      expect(httpServer.server).toBe(mockServer);
    });
  });

  describe('setWsServer', () => {
    it('should initialize stats service with ws server managers', () => {
      // Arrange
      const mockSessionManager = {};
      const mockRoomManager = {};
      const wsServerWithManagers = mockWsServer as unknown as {
        sessionManager: unknown;
        roomManager: unknown;
      };
      wsServerWithManagers.sessionManager = mockSessionManager;
      wsServerWithManagers.roomManager = mockRoomManager;

      // Act
      httpServer.setWsServer(mockWsServer);

      // Assert
      expect(statsService.initialize).toHaveBeenCalledWith(mockSessionManager, mockRoomManager);
    });
  });

  describe('serveClient', () => {
    it('should serve static files when client build exists', () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(true);

      // Act - Trigger serveClient by accessing the private method
      const serveClientMethod = (httpServer as unknown as {
        serveClient: () => void;
      }).serveClient.bind(httpServer);
      serveClientMethod();

      // Assert
      expect(fs.existsSync).toHaveBeenCalled();
    });

    it('should log warning and not serve client when build does not exist', () => {
      // Arrange
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // Act
      const serveClientMethod = (httpServer as unknown as {
        serveClient: () => void;
      }).serveClient.bind(httpServer);
      serveClientMethod();

      // Assert
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Client build not found')
      );
    });
  });

  describe('start', () => {
    it('should start the server on the specified port', async () => {
      // Arrange
      mockServer.listen.mockImplementation(
        (port: unknown, callback: unknown) => {
          (callback as () => void)?.();
          return mockServer;
        }
      );

      // Act
      await httpServer.start();

      // Assert
      expect(mockServer.listen).toHaveBeenCalledWith(8745, expect.any(Function));
      expect(console.log).toHaveBeenCalledWith(
        'HTTP server is running on http://localhost:8745'
      );
    });
  });

  describe('close', () => {
    it('should close the server and resolve promise', async () => {
      // Arrange
      mockServer.close.mockImplementation((callback: unknown) => {
        (callback as () => void)?.();
        return mockServer;
      });

      // Act
      await httpServer.close();

      // Assert
      expect(mockServer.close).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('HTTP server closed');
    });
  });
});
