import request from 'supertest';
import { jest } from '@jest/globals';

import HTTPServer from '../core/HTTPServer';

import type SessionManager from '../managers/SessionManager';
import type RoomManager from '../managers/RoomManager';
import type WSServer from '../core/WSServer';


jest.mock('../services/RedisService', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    setStartupTime: jest.fn<() => Promise<void>>(),
  },
}));

jest.mock('../services/GuestAuthService', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    authenticate: jest.fn(),
  },
}));

describe('HTTPServer - General Stats API', () => {
  let httpServer: HTTPServer;
  let mockWsServer: WSServer;
  let mockSessionManager: SessionManager;
  let mockRoomManager: RoomManager;
  let originalApiKey: string | undefined;
  let originalNodeEnv: string | undefined;

  beforeAll(() => {
    originalApiKey = process.env['API_KEY'];
    originalNodeEnv = process.env['NODE_ENV'];
  });

  beforeEach(() => {
    jest.clearAllMocks();
    process.env['API_KEY'] = 'test-api-key';
    process.env['NODE_ENV'] = 'test';

    // Create mock managers
    mockSessionManager = {
      getOnlineCount: jest.fn<() => number>().mockReturnValue(0),
    } as unknown as SessionManager;

    mockRoomManager = {
      getActiveRoomsCount: jest.fn<() => number>().mockReturnValue(0),
    } as unknown as RoomManager;

    // Create mock WS server
    mockWsServer = {
      getSessionManager: jest.fn<() => SessionManager>().mockReturnValue(mockSessionManager),
      getRoomManager: jest.fn<() => RoomManager>().mockReturnValue(mockRoomManager),
    } as unknown as WSServer;

    httpServer = new HTTPServer(8890);
    httpServer.setWsServer(mockWsServer);
  });

  afterEach(async () => {
    await httpServer.close();
  });

  afterAll(() => {
    process.env['API_KEY'] = originalApiKey;
    process.env['NODE_ENV'] = originalNodeEnv;
  });

  describe('GET /api/stats', () => {
    describe('authentication', () => {
      it('should reject requests without API key', async () => {
        const response = await request(httpServer.app)
          .get('/api/stats')
          .expect(401);

        expect(response.body).toEqual({ error: 'Unauthorized' });
      });

      it('should reject requests with invalid API key', async () => {
        const response = await request(httpServer.app)
          .get('/api/stats')
          .set('x-api-key', 'wrong-key')
          .expect(401);

        expect(response.body).toEqual({ error: 'Unauthorized' });
      });

      it('should accept requests with valid API key', async () => {
        await request(httpServer.app)
          .get('/api/stats')
          .set('x-api-key', 'test-api-key')
          .expect(200);
      });

      it('should allow requests in dev mode without API key when not configured', async () => {
        process.env['NODE_ENV'] = 'development';
        delete process.env['API_KEY'];

        const devServer = new HTTPServer(8891);
        devServer.setWsServer(mockWsServer);

        await request(devServer.app)
          .get('/api/stats')
          .expect(200);

        await devServer.close();

        // Restore
        process.env['API_KEY'] = 'test-api-key';
        process.env['NODE_ENV'] = 'test';
      });
    });

    describe('stats response', () => {
      it('should return general server stats with all fields', async () => {
        (mockSessionManager.getOnlineCount as jest.Mock<() => number>).mockReturnValue(42);
        (mockRoomManager.getActiveRoomsCount as jest.Mock<() => number>).mockReturnValue(7);

        const response = await request(httpServer.app)
          .get('/api/stats')
          .set('x-api-key', 'test-api-key')
          .expect(200);

        expect(response.body).toHaveProperty('activeSessions', 42);
        expect(response.body).toHaveProperty('activeRooms', 7);
        expect(response.body).toHaveProperty('serverUptime');
        expect(response.body).toHaveProperty('at');
        expect(typeof response.body.serverUptime).toBe('number');
        expect(typeof response.body.at).toBe('number');
        expect(response.body.serverUptime).toBeGreaterThanOrEqual(0);
      });

      it('should return 0 for activeSessions when no sessions exist', async () => {
        (mockSessionManager.getOnlineCount as jest.Mock<() => number>).mockReturnValue(0);
        (mockRoomManager.getActiveRoomsCount as jest.Mock<() => number>).mockReturnValue(0);

        const response = await request(httpServer.app)
          .get('/api/stats')
          .set('x-api-key', 'test-api-key')
          .expect(200);

        expect(response.body.activeSessions).toBe(0);
        expect(response.body.activeRooms).toBe(0);
      });

      it('should calculate correct server uptime', async () => {
        // Wait a bit to ensure uptime is > 0
        await new Promise(resolve => setTimeout(resolve, 10));

        const response = await request(httpServer.app)
          .get('/api/stats')
          .set('x-api-key', 'test-api-key')
          .expect(200);

        expect(response.body.serverUptime).toBeGreaterThan(0);
        expect(response.body.serverUptime).toBeLessThan(10000); // Less than 10 seconds
      });

      it('should return JSON format only', async () => {
        const response = await request(httpServer.app)
          .get('/api/stats')
          .set('x-api-key', 'test-api-key')
          .expect(200)
          .expect('Content-Type', /json/);

        expect(typeof response.body).toBe('object');
      });

      it('should call SessionManager.getOnlineCount', async () => {
        await request(httpServer.app)
          .get('/api/stats')
          .set('x-api-key', 'test-api-key')
          .expect(200);

        expect(mockSessionManager.getOnlineCount).toHaveBeenCalled();
      });

      it('should call RoomManager.getActiveRoomsCount', async () => {
        await request(httpServer.app)
          .get('/api/stats')
          .set('x-api-key', 'test-api-key')
          .expect(200);

        expect(mockRoomManager.getActiveRoomsCount).toHaveBeenCalled();
      });
    });

    describe('error handling', () => {
      it('should handle errors when WS server not initialized', async () => {
        const serverWithoutWs = new HTTPServer(8892);
        // Don't call setWsServer

        const response = await request(serverWithoutWs.app)
          .get('/api/stats')
          .set('x-api-key', 'test-api-key')
          .expect(500);

        expect(response.body).toEqual({ error: 'Internal server error' });

        await serverWithoutWs.close();
      });
    });
  });
});
