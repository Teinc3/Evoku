import request from 'supertest';
import { jest } from '@jest/globals';

import HTTPServer from '../core/HTTPServer';
import redisService from '../services/RedisService';

import type { Application } from 'express';


jest.mock('../services/RedisService', () => ({
  __esModule: true,
  default: {
    zRangeByScoreWithScores: jest.fn<
      () => Promise<Array<{ value: string; score: number }>>
    >(),
    setStartupTime: jest.fn<() => Promise<void>>(),
  },
}));

jest.mock('../services/GuestAuthService', () => ({
  __esModule: true,
  default: {
    authenticate: jest.fn(),
  },
}));

describe('HTTPServer - Online Stats API', () => {
  let httpServer: HTTPServer;
  let app: Application;
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

    httpServer = new HTTPServer(8888);
    app = httpServer.app;
  });

  afterEach(async () => {
    await httpServer.close();
  });

  afterAll(() => {
    process.env['API_KEY'] = originalApiKey;
    process.env['NODE_ENV'] = originalNodeEnv;
  });

  describe('GET /api/stats/online', () => {
    describe('authentication', () => {
      it('should reject requests without API key', async () => {
        const response = await request(app)
          .get('/api/stats/online')
          .expect(401);

        expect(response.body).toEqual({ error: 'Unauthorized' });
      });

      it('should reject requests with invalid API key', async () => {
        const response = await request(app)
          .get('/api/stats/online')
          .set('x-api-key', 'wrong-key')
          .expect(401);

        expect(response.body).toEqual({ error: 'Unauthorized' });
      });

      it('should accept requests with valid API key', async () => {
        (redisService.zRangeByScoreWithScores as jest.Mock<
          () => Promise<Array<{ value: string; score: number }>>
        >).mockResolvedValue([
          { value: '5', score: Date.now() }
        ]);

        await request(app)
          .get('/api/stats/online')
          .set('x-api-key', 'test-api-key')
          .expect(200);
      });

      it('should allow requests in dev mode without API key when not configured', async () => {
        process.env['NODE_ENV'] = 'development';
        delete process.env['API_KEY'];

        const devServer = new HTTPServer(8889);
        (redisService.zRangeByScoreWithScores as jest.Mock<
          () => Promise<Array<{ value: string; score: number }>>
        >).mockResolvedValue([
          { value: '5', score: Date.now() }
        ]);

        await request(devServer.app)
          .get('/api/stats/online')
          .expect(200);

        await devServer.close();

        // Restore
        process.env['API_KEY'] = 'test-api-key';
        process.env['NODE_ENV'] = 'test';
      });
    });

    describe('current stats', () => {
      it('should return current online count', async () => {
        const mockTimestamp = Date.now();
        (redisService.zRangeByScoreWithScores as jest.Mock<
          () => Promise<Array<{ value: string; score: number }>>
        >).mockResolvedValue([
          { value: '42', score: mockTimestamp }
        ]);

        const response = await request(app)
          .get('/api/stats/online')
          .set('x-api-key', 'test-api-key')
          .expect(200);

        expect(response.body).toEqual({
          online: 42,
          at: mockTimestamp,
        });
      });

      it('should return 0 when no data available', async () => {
        (redisService.zRangeByScoreWithScores as jest.Mock<
          () => Promise<Array<{ value: string; score: number }>>
        >).mockResolvedValue([]);

        const response = await request(app)
          .get('/api/stats/online')
          .set('x-api-key', 'test-api-key')
          .expect(200);

        expect(response.body.online).toBe(0);
        expect(response.body.at).toBeGreaterThan(0);
      });

      it('should query last minute of data', async () => {
        const now = Date.now();
        jest.spyOn(Date, 'now').mockReturnValue(now);

        (redisService.zRangeByScoreWithScores as jest.Mock<
          () => Promise<Array<{ value: string; score: number }>>
        >).mockResolvedValue([
          { value: '10', score: now }
        ]);

        await request(app)
          .get('/api/stats/online')
          .set('x-api-key', 'test-api-key')
          .expect(200);

        expect(redisService.zRangeByScoreWithScores).toHaveBeenCalledWith(
          'stats:online',
          now - 60_000,
          now
        );

        jest.restoreAllMocks();
      });
    });

    describe('historical stats', () => {
      it('should return JSON format for 1h range', async () => {
        const mockData = [
          { value: '10', score: 1000000 },
          { value: '20', score: 2000000 },
          { value: '30', score: 3000000 },
        ];
        (redisService.zRangeByScoreWithScores as jest.Mock<
          () => Promise<Array<{ value: string; score: number }>>
        >).mockResolvedValue(mockData);

        const response = await request(app)
          .get('/api/stats/online')
          .query({ range: '1h', format: 'json' })
          .set('x-api-key', 'test-api-key')
          .expect(200);

        expect(response.body).toEqual([
          { at: 1000000, online: 10 },
          { at: 2000000, online: 20 },
          { at: 3000000, online: 30 },
        ]);
      });

      it('should return text format for 24h range', async () => {
        const mockData = [
          { value: '15', score: 1609459200000 }, // 2021-01-01T00:00:00.000Z
          { value: '25', score: 1609545600000 }, // 2021-01-02T00:00:00.000Z
        ];
        (redisService.zRangeByScoreWithScores as jest.Mock<
          () => Promise<Array<{ value: string; score: number }>>
        >).mockResolvedValue(mockData);

        const response = await request(app)
          .get('/api/stats/online')
          .query({ range: '24h', format: 'text' })
          .set('x-api-key', 'test-api-key')
          .expect(200)
          .expect('Content-Type', /text\/plain/);

        const expectedText = 
          '2021-01-01T00:00:00.000Z,15\n' +
          '2021-01-02T00:00:00.000Z,25';

        expect(response.text).toBe(expectedText);
      });

      it('should default to text format when format not specified', async () => {
        const mockData = [
          { value: '5', score: 1000000 },
        ];
        (redisService.zRangeByScoreWithScores as jest.Mock<
          () => Promise<Array<{ value: string; score: number }>>
        >).mockResolvedValue(mockData);

        const response = await request(app)
          .get('/api/stats/online')
          .query({ range: '7d' })
          .set('x-api-key', 'test-api-key')
          .expect(200)
          .expect('Content-Type', /text\/plain/);

        expect(typeof response.text).toBe('string');
      });

      it('should query correct time range for 1h', async () => {
        const now = Date.now();
        jest.spyOn(Date, 'now').mockReturnValue(now);

        (redisService.zRangeByScoreWithScores as jest.Mock<
          () => Promise<Array<{ value: string; score: number }>>
        >).mockResolvedValue([]);

        await request(app)
          .get('/api/stats/online')
          .query({ range: '1h' })
          .set('x-api-key', 'test-api-key')
          .expect(200);

        expect(redisService.zRangeByScoreWithScores).toHaveBeenCalledWith(
          'stats:online',
          now - 60 * 60 * 1000,
          now
        );

        jest.restoreAllMocks();
      });

      it('should query correct time range for 24h', async () => {
        const now = Date.now();
        jest.spyOn(Date, 'now').mockReturnValue(now);

        (redisService.zRangeByScoreWithScores as jest.Mock<
          () => Promise<Array<{ value: string; score: number }>>
        >).mockResolvedValue([]);

        await request(app)
          .get('/api/stats/online')
          .query({ range: '24h' })
          .set('x-api-key', 'test-api-key')
          .expect(200);

        expect(redisService.zRangeByScoreWithScores).toHaveBeenCalledWith(
          'stats:online',
          now - 24 * 60 * 60 * 1000,
          now
        );

        jest.restoreAllMocks();
      });

      it('should query correct time range for 7d', async () => {
        const now = Date.now();
        jest.spyOn(Date, 'now').mockReturnValue(now);

        (redisService.zRangeByScoreWithScores as jest.Mock<
          () => Promise<Array<{ value: string; score: number }>>
        >).mockResolvedValue([]);

        await request(app)
          .get('/api/stats/online')
          .query({ range: '7d' })
          .set('x-api-key', 'test-api-key')
          .expect(200);

        expect(redisService.zRangeByScoreWithScores).toHaveBeenCalledWith(
          'stats:online',
          now - 7 * 24 * 60 * 60 * 1000,
          now
        );

        jest.restoreAllMocks();
      });
    });

    describe('error handling', () => {
      it('should handle Redis errors gracefully', async () => {
        (redisService.zRangeByScoreWithScores as jest.Mock<
          () => Promise<Array<{ value: string; score: number }>>
        >).mockRejectedValue(
          new Error('Redis connection failed')
        );

        const response = await request(app)
          .get('/api/stats/online')
          .set('x-api-key', 'test-api-key')
          .expect(500);

        expect(response.body).toEqual({ error: 'Internal server error' });
      });
    });
  });
});
