import { jest } from '@jest/globals';

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
  },
}));

describe('StatsService', () => {
  let statsService: StatsService;
  let mockSessionManager: SessionManager;
  let mockRoomManager: RoomManager;

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
      const mockStats = { activeSessions: 15, activeRooms: 2, at: Date.now() - 1800000 };
      (redisService.get as jest.Mock<() => Promise<string | null>>)
        .mockResolvedValue(JSON.stringify(mockStats));

      // Act
      const result = await statsService.getHistoricalStats('1h');

      // Assert
      expect(redisService.get).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array when no data exists', async () => {
      // Arrange
      (redisService.get as jest.Mock<() => Promise<string | null>>).mockResolvedValue(null);

      // Act
      const result = await statsService.getHistoricalStats('24h');

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle invalid JSON gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (redisService.get as jest.Mock<() => Promise<string | null>>)
        .mockResolvedValue('invalid json');

      // Act
      const result = await statsService.getHistoricalStats('7d');

      // Assert
      expect(result).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('should sort stats by timestamp', async () => {
      // Arrange
      const stats1 = { activeSessions: 10, activeRooms: 1, at: 1000 };
      const stats2 = { activeSessions: 20, activeRooms: 2, at: 2000 };
      const stats3 = { activeSessions: 15, activeRooms: 3, at: 1500 };

      let callCount = 0;
      (redisService.get as jest.Mock<() => Promise<string | null>>).mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve(JSON.stringify(stats1));
        if (callCount === 2) return Promise.resolve(JSON.stringify(stats3));
        if (callCount === 3) return Promise.resolve(JSON.stringify(stats2));
        return Promise.resolve(null);
      });

      // Act
      const result = await statsService.getHistoricalStats('1h');

      // Assert
      const validStats = result.filter(s => s.at > 0);
      expect(validStats.length).toBeGreaterThanOrEqual(3);
      
      // Check that stats are sorted
      for (let i = 1; i < validStats.length; i++) {
        expect(validStats[i].at).toBeGreaterThanOrEqual(validStats[i - 1].at);
      }
    });
  });
});
