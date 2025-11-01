import request from 'supertest';
import { jest } from '@jest/globals';

import HTTPServer from '../core/HTTPServer';

import type { StatsService } from '../services/StatsService';
import type SessionManager from '../managers/SessionManager';
import type RoomManager from '../managers/RoomManager';
import type WSServer from '../core/WSServer';


jest.mock('../services/GuestAuthService', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    authenticate: jest.fn(),
  },
}));

describe('HTTPServer - Stats API', () => {
  let httpServer: HTTPServer;
  let mockWsServer: WSServer;
  let mockSessionManager: SessionManager;
  let mockRoomManager: RoomManager;

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock managers
    mockSessionManager = {
      getOnlineCount: jest.fn<() => number>().mockReturnValue(0),
    } as unknown as SessionManager;

    mockRoomManager = {
      getActiveRoomsCount: jest.fn<() => number>().mockReturnValue(0),
    } as unknown as RoomManager;

    // Create mock WS server
    mockWsServer = {
      sessionManager: mockSessionManager,
      roomManager: mockRoomManager,
    } as unknown as WSServer;

    httpServer = new HTTPServer(8890);
    httpServer.setWsServer(mockWsServer);
  });

  afterEach(async () => {
    await httpServer.close();
  });

  describe('GET /api/stats', () => {
    describe('rate limiting', () => {
      it('should apply rate limiting to stats endpoint', async () => {
        // Make 61 requests rapidly
        const requests = [];
        for (let i = 0; i < 61; i++) {
          requests.push(request(httpServer.app).get('/api/stats'));
        }

        const responses = await Promise.all(requests);
        
        // At least one should be rate limited
        const rateLimited = responses.filter(r => r.status === 429);
        expect(rateLimited.length).toBeGreaterThan(0);
      });
    });

    describe('current stats', () => {
      it('should return current stats with all fields', async () => {
        (mockSessionManager.getOnlineCount as jest.Mock<() => number>).mockReturnValue(42);
        (mockRoomManager.getActiveRoomsCount as jest.Mock<() => number>).mockReturnValue(7);

        const response = await request(httpServer.app)
          .get('/api/stats')
          .expect(200);

        expect(response.body).toHaveProperty('activeSessions', 42);
        expect(response.body).toHaveProperty('activeRooms', 7);
        expect(response.body).toHaveProperty('uptime');
        expect(typeof response.body.uptime).toBe('number');
        expect(response.body.uptime).toBeGreaterThanOrEqual(0);
        expect(response.body).toHaveProperty('at');
        expect(typeof response.body.at).toBe('number');
        expect(response.body.at).toBeGreaterThan(0);
      });

      it('should return 0 for both counts when no sessions or rooms exist', async () => {
        const response = await request(httpServer.app)
          .get('/api/stats')
          .expect(200);

        expect(response.body.activeSessions).toBe(0);
        expect(response.body.activeRooms).toBe(0);
        expect(response.body.uptime).toBeGreaterThanOrEqual(0);
      });

      it('should return JSON format', async () => {
        const response = await request(httpServer.app)
          .get('/api/stats')
          .expect(200)
          .expect('Content-Type', /json/);

        expect(typeof response.body).toBe('object');
      });

      it('should call SessionManager.getOnlineCount', async () => {
        await request(httpServer.app)
          .get('/api/stats')
          .expect(200);

        expect(mockSessionManager.getOnlineCount).toHaveBeenCalled();
      });

      it('should call RoomManager.getActiveRoomsCount', async () => {
        await request(httpServer.app)
          .get('/api/stats')
          .expect(200);

        expect(mockRoomManager.getActiveRoomsCount).toHaveBeenCalled();
      });
    });

    describe('historical stats', () => {
      let mockStatsService: StatsService;

      beforeEach(() => {
        // Replace statsService with a mock
        mockStatsService = {
          getCurrentStats: jest.fn().mockReturnValue({
            activeSessions: 10,
            activeRooms: 2,
            uptime: 3600000,
            at: Date.now(),
          }),
          getHistoricalStats: jest.fn<() => Promise<unknown>>().mockResolvedValue([]),
        } as unknown as StatsService;

        httpServer['statsService'] = mockStatsService;
      });

      it('should return historical data for 1h range', async () => {
        const mockData = [
          { activeSessions: 10, activeRooms: 1, uptime: 3600000, at: 1000000 },
          { activeSessions: 20, activeRooms: 2, uptime: 3660000, at: 2000000 },
        ];
        (mockStatsService.getHistoricalStats as jest.Mock<() => Promise<unknown>>)
          .mockResolvedValue(mockData);

        const response = await request(httpServer.app)
          .get('/api/stats')
          .query({ range: '1h' })
          .expect(200);

        expect(response.body).toEqual(mockData);
        expect(mockStatsService.getHistoricalStats).toHaveBeenCalledWith('1h');
      });

      it('should return historical data for 24h range', async () => {
        const mockData = [
          { activeSessions: 15, activeRooms: 3, uptime: 86400000, at: 1000000 },
        ];
        (mockStatsService.getHistoricalStats as jest.Mock<() => Promise<unknown>>)
          .mockResolvedValue(mockData);

        const response = await request(httpServer.app)
          .get('/api/stats')
          .query({ range: '24h' })
          .expect(200);

        expect(response.body).toEqual(mockData);
        expect(mockStatsService.getHistoricalStats).toHaveBeenCalledWith('24h');
      });

      it('should return historical data for 7d range', async () => {
        (mockStatsService.getHistoricalStats as jest.Mock<() => Promise<unknown>>)
          .mockResolvedValue([]);

        await request(httpServer.app)
          .get('/api/stats')
          .query({ range: '7d' })
          .expect(200);

        expect(mockStatsService.getHistoricalStats).toHaveBeenCalledWith('7d');
      });
    });

    describe('error handling', () => {
      it('should handle errors when stats service not initialized', async () => {
        const serverWithoutWs = new HTTPServer(8891);
        // Don't call setWsServer

        const response = await request(serverWithoutWs.app)
          .get('/api/stats')
          .expect(500);

        expect(response.status).toBe(500);

        await serverWithoutWs.close();
      });

      it('should handle errors when getCurrentStats throws', async () => {
        const mockStatsServiceError = {
          getCurrentStats: jest.fn().mockImplementation(() => {
            throw new Error('Stats error');
          }),
          getHistoricalStats: jest.fn<() => Promise<unknown>>().mockResolvedValue([]),
        } as unknown as StatsService;

        httpServer['statsService'] = mockStatsServiceError;

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await request(httpServer.app)
          .get('/api/stats')
          .expect(500);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error in stats endpoint:',
          expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
      });

      it('should handle errors when getHistoricalStats throws', async () => {
        const mockStatsServiceError = {
          getCurrentStats: jest.fn().mockReturnValue({
            activeSessions: 10,
            activeRooms: 2,
            uptime: 3600000,
            at: Date.now(),
          }),
          getHistoricalStats: jest.fn<() => Promise<unknown>>().mockRejectedValue(
            new Error('Historical stats error')
          ),
        } as unknown as StatsService;

        httpServer['statsService'] = mockStatsServiceError;

        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

        await request(httpServer.app)
          .get('/api/stats')
          .query({ range: '1h' })
          .expect(500);

        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error in stats endpoint:',
          expect.any(Error)
        );

        consoleErrorSpy.mockRestore();
      });
    });
  });
});
