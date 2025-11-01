import { jest } from '@jest/globals';

import { StatsRange } from '../types/stats/online';
import { StatsService } from './StatsService';
import redisService from './RedisService';

import type SessionManager from '../managers/SessionManager';
import type RoomManager from '../managers/RoomManager';


jest.mock('./RedisService', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    set: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    get: jest.fn<() => Promise<string | null>>().mockResolvedValue(null),
    keys: jest.fn<() => Promise<string[]>>().mockResolvedValue([]),
  },
}));

describe('StatsService', () => {
  let statsService: StatsService;
  let mockSessionManager: SessionManager;
  let mockRoomManager: RoomManager;

  beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockSessionManager = {
      getOnlineCount: jest.fn<() => number>().mockReturnValue(0),
    } as unknown as SessionManager;

    mockRoomManager = {
      getActiveRoomsCount: jest.fn<() => number>().mockReturnValue(0),
    } as unknown as RoomManager;

    statsService = new StatsService(mockSessionManager, mockRoomManager);
  });

  describe('constructor', () => {
    it('should log startup time to Redis', async () => {
      // Wait for async constructor logic
      await new Promise(resolve => setImmediate(resolve));

      // Assert
      expect(redisService.set).toHaveBeenCalledWith(
        'server:startup',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      );
    });
  });

  describe('getCurrentStats', () => {
    it('should return current stats with session and room counts', () => {
      // Arrange
      (mockSessionManager.getOnlineCount as jest.Mock<() => number>).mockReturnValue(42);
      (mockRoomManager.getActiveRoomsCount as jest.Mock<() => number>).mockReturnValue(7);

      // Act
      const stats = statsService.getCurrentStats();

      // Assert
      expect(stats.activeSessions).toBe(42);
      expect(stats.activeRooms).toBe(7);
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
      expect(typeof stats.uptime).toBe('number');
      expect(stats.at).toBeGreaterThan(0);
      expect(typeof stats.at).toBe('number');
    });

    it('should return 0 for both counts when no sessions or rooms exist', () => {
      // Act
      const stats = statsService.getCurrentStats();

      // Assert
      expect(stats.activeSessions).toBe(0);
      expect(stats.activeRooms).toBe(0);
      expect(stats.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('sampleStats', () => {
    it('should persist stats to Redis with correct key format', async () => {
      // Arrange
      jest.clearAllMocks(); // Clear startup call
      (mockSessionManager.getOnlineCount as jest.Mock<() => number>).mockReturnValue(10);
      (mockRoomManager.getActiveRoomsCount as jest.Mock<() => number>).mockReturnValue(3);

      // Act
      await statsService.sampleStats();

      // Assert
      expect(redisService.set).toHaveBeenCalledTimes(1);
      const callArgs = (redisService.set as jest.Mock).mock.calls[0];
      expect(callArgs[0]).toMatch(/^stats:\d+$/);
      
      const parsedData = JSON.parse(callArgs[1] as string);
      expect(parsedData.activeSessions).toBe(10);
      expect(parsedData.activeRooms).toBe(3);
      expect(parsedData.uptime).toBeGreaterThanOrEqual(0);
      expect(parsedData.at).toBeGreaterThan(0);
    });

    it('should handle Redis errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (redisService.set as jest.Mock<() => Promise<void>>).mockRejectedValueOnce(
        new Error('Redis error')
      );

      // Act & Assert - should not throw
      await expect(statsService.sampleStats()).resolves.toBeUndefined();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to persist stats to Redis:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getHistoricalStats', () => {
    it('should retrieve and parse stats from Redis for 1h range', async () => {
      // Arrange
      const now = Date.now();
      const timestamp = now - 1800000;
      const mockStats = { activeSessions: 15, activeRooms: 2, uptime: 1800000, at: timestamp };
      
      (redisService.keys as jest.Mock<() => Promise<string[]>>)
        .mockResolvedValue([`stats:${timestamp}`]);
      (redisService.get as jest.Mock<() => Promise<string | null>>)
        .mockResolvedValue(JSON.stringify(mockStats));

      // Act
      const result = await statsService.getHistoricalStats(StatsRange.ONE_HOUR);

      // Assert
      expect(redisService.keys).toHaveBeenCalledWith('stats:*');
      expect(redisService.get).toHaveBeenCalled();
      expect(result.length).toBe(1);
      expect(result[0]).toEqual(mockStats);
    });

    it('should return empty array when no data exists', async () => {
      // Arrange
      (redisService.keys as jest.Mock<() => Promise<string[]>>).mockResolvedValue([]);

      // Act
      const result = await statsService.getHistoricalStats(StatsRange.ONE_DAY);

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle invalid JSON gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const timestamp = Date.now() - 3600000;
      
      (redisService.keys as jest.Mock<() => Promise<string[]>>)
        .mockResolvedValue([`stats:${timestamp}`]);
      (redisService.get as jest.Mock<() => Promise<string | null>>)
        .mockResolvedValue('invalid json');

      // Act
      const result = await statsService.getHistoricalStats(StatsRange.ONE_WEEK);

      // Assert
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should sort stats by timestamp', async () => {
      // Arrange - using 1d range to have more data points (24 hours = up to 24 samples)
      const now = Date.now();
      const oneHourMs = 3600_000;
      
      const stats1 = { activeSessions: 10, activeRooms: 1, uptime: 10000, at: now - oneHourMs * 3 };
      const stats2 = { activeSessions: 20, activeRooms: 2, uptime: 20000, at: now - oneHourMs * 1 };
      const stats3 = { activeSessions: 15, activeRooms: 3, uptime: 15000, at: now - oneHourMs * 2 };

      (redisService.keys as jest.Mock<() => Promise<string[]>>).mockResolvedValue([
        `stats:${stats1.at}`,
        `stats:${stats3.at}`,
        `stats:${stats2.at}`,
      ]);

      let callCount = 0;
      (redisService.get as jest.Mock<() => Promise<string | null>>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(JSON.stringify(stats1));
        if (callCount === 2) return Promise.resolve(JSON.stringify(stats3));
        if (callCount === 3) return Promise.resolve(JSON.stringify(stats2));
        return Promise.resolve(null);
      });

      // Act
      const result = await statsService.getHistoricalStats(StatsRange.ONE_DAY);

      // Assert
      expect(result.length).toBe(3);
      
      // Check that stats are sorted by timestamp (newest first)
      expect(result[0].at).toBe(stats2.at);
      expect(result[1].at).toBe(stats3.at);
      expect(result[2].at).toBe(stats1.at);
    });

    it('should filter stats by time range', async () => {
      // Arrange
      const now = Date.now();
      const oneHourMs = 3600_000;
      
      const withinRange = { 
        activeSessions: 10, 
        activeRooms: 1, 
        uptime: 10000, 
        at: now - 30 * 60 * 1000 
      };
      const outsideRange = { 
        activeSessions: 20, 
        activeRooms: 2, 
        uptime: 20000, 
        at: now - 2 * oneHourMs 
      };

      (redisService.keys as jest.Mock<() => Promise<string[]>>).mockResolvedValue([
        `stats:${withinRange.at}`,
        `stats:${outsideRange.at}`,
      ]);

      (redisService.get as jest.Mock<(key: string) => Promise<string | null>>)
        .mockImplementation((key: string) => {
          if (key.includes(String(withinRange.at))) {
            return Promise.resolve(JSON.stringify(withinRange));
          }
          if (key.includes(String(outsideRange.at))) {
            return Promise.resolve(JSON.stringify(outsideRange));
          }
          return Promise.resolve(null);
        });

      // Act
      const result = await statsService.getHistoricalStats(StatsRange.ONE_HOUR);

      // Assert
      expect(result.length).toBe(1);
      expect(result[0].at).toBe(withinRange.at);
    });

    it('should limit results to 200 entries', async () => {
      // Arrange
      const now = Date.now();
      const oneHourMs = 3600_000;
      const oneWeekMs = 7 * 24 * oneHourMs;
      
      // Generate 250 keys within the 1w range
      const keys = Array.from(
        { length: 250 }, 
        (_, i) => `stats:${now - (i * oneHourMs)}`
      );
      
      (redisService.keys as jest.Mock<() => Promise<string[]>>).mockResolvedValue(keys);
      (redisService.get as jest.Mock<(key: string) => Promise<string | null>>)
        .mockImplementation((key: string) => {
          const timestamp = parseInt(key.replace('stats:', ''), 10);
          return Promise.resolve(
            JSON.stringify({ 
              activeSessions: 1, 
              activeRooms: 1, 
              uptime: 1, 
              at: timestamp 
            })
          );
        });

      // Act
      const result = await statsService.getHistoricalStats(StatsRange.ONE_WEEK);

      // Assert - should be limited to 200 (only keys within 1w range)
      expect(result.length).toBeLessThanOrEqual(200);
      
      // Verify all results are within the 1w range
      const startTime = now - oneWeekMs;
      for (const stat of result) {
        expect(stat.at).toBeGreaterThanOrEqual(startTime);
        expect(stat.at).toBeLessThanOrEqual(now);
      }
    });
  });
});
