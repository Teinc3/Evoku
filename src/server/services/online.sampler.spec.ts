import { jest } from '@jest/globals';

import OnlineSampler from './online.sampler';
import redisService from './RedisService';

import type SessionManager from '../managers/SessionManager';


jest.mock('./RedisService', () => ({
  __esModule: true,
  default: {
    zAdd: jest.fn<() => Promise<number>>().mockResolvedValue(1),
  },
}));

describe('OnlineSampler', () => {
  let sampler: OnlineSampler;
  let mockSessionManager: SessionManager;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockSessionManager = {
      getOnlineCount: jest.fn<() => number>().mockReturnValue(0),
    } as unknown as SessionManager;

    sampler = new OnlineSampler(mockSessionManager);
  });

  afterEach(() => {
    sampler.stop();
    jest.useRealTimers();
  });

  describe('start', () => {
    it('should align to next minute boundary before first sample', () => {
      // Arrange - Set time to 12:34:45.500
      const mockDate = new Date('2024-01-01T12:34:45.500Z');
      jest.setSystemTime(mockDate);

      // Act
      sampler.start();

      // Expected delay: (60 - 45) * 1000 - 500 = 14,500ms
      jest.advanceTimersByTime(14_499);
      expect(mockSessionManager.getOnlineCount).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockSessionManager.getOnlineCount).toHaveBeenCalledTimes(1);
    });

    it('should sample every 60 seconds after alignment', () => {
      // Arrange
      const mockDate = new Date('2024-01-01T12:34:00.000Z');
      jest.setSystemTime(mockDate);

      // Act
      sampler.start();

      // Advance to first sample (at :00)
      jest.advanceTimersByTime(60_000);
      expect(mockSessionManager.getOnlineCount).toHaveBeenCalledTimes(1);

      // Advance 60 more seconds
      jest.advanceTimersByTime(60_000);
      expect(mockSessionManager.getOnlineCount).toHaveBeenCalledTimes(2);

      // Advance another 60 seconds
      jest.advanceTimersByTime(60_000);
      expect(mockSessionManager.getOnlineCount).toHaveBeenCalledTimes(3);
    });

    it('should persist count to Redis with correct key and timestamp', async () => {
      // Arrange
      const mockDate = new Date('2024-01-01T12:34:00.000Z');
      jest.setSystemTime(mockDate);
      (mockSessionManager.getOnlineCount as jest.Mock<() => number>).mockReturnValue(42);

      // Act
      sampler.start();
      jest.advanceTimersByTime(60_000);

      // Wait for promises
      await Promise.resolve();

      // Assert
      expect(redisService.zAdd).toHaveBeenCalledWith(
        'stats:online',
        expect.any(Number),
        '42'
      );
    });

    it('should not start if already running', () => {
      // Arrange
      sampler.start();
      const firstTimer = sampler['timer'];

      // Act
      sampler.start();

      // Assert
      expect(sampler['timer']).toBe(firstTimer);
    });

    it('should handle Redis errors gracefully', async () => {
      // Arrange
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const redisError = new Error('Redis connection failed');
      (redisService.zAdd as jest.Mock<() => Promise<number>>)
        .mockRejectedValueOnce(redisError);

      const mockDate = new Date('2024-01-01T12:34:00.000Z');
      jest.setSystemTime(mockDate);

      // Act
      sampler.start();
      jest.advanceTimersByTime(60_000);
      await Promise.resolve();

      // Assert
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to persist online count to Redis:',
        redisError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('stop', () => {
    it('should clear the timer', () => {
      // Arrange
      const mockDate = new Date('2024-01-01T12:34:00.000Z');
      jest.setSystemTime(mockDate);
      sampler.start();
      
      // Advance to when timer is set (after alignment)
      jest.advanceTimersByTime(60_000);
      expect(sampler['timer']).not.toBeNull();

      // Act
      sampler.stop();

      // Assert
      expect(sampler['timer']).toBeNull();
    });

    it('should stop sampling after stop is called', () => {
      // Arrange
      const mockDate = new Date('2024-01-01T12:34:00.000Z');
      jest.setSystemTime(mockDate);
      sampler.start();

      // Act - Advance to first sample
      jest.advanceTimersByTime(60_000);
      expect(mockSessionManager.getOnlineCount).toHaveBeenCalledTimes(1);

      sampler.stop();

      // Advance more time - should not sample anymore
      jest.advanceTimersByTime(60_000);
      expect(mockSessionManager.getOnlineCount).toHaveBeenCalledTimes(1);
    });

    it('should handle being called when not running', () => {
      // Act & Assert - Should not throw
      expect(() => sampler.stop()).not.toThrow();
    });
  });

  describe('sample', () => {
    it('should read count from SessionManager', async () => {
      // Arrange
      (mockSessionManager.getOnlineCount as jest.Mock<() => number>).mockReturnValue(15);
      const sampleMethod = sampler['sample'].bind(sampler);

      // Act
      await sampleMethod();

      // Assert
      expect(mockSessionManager.getOnlineCount).toHaveBeenCalled();
      expect(redisService.zAdd).toHaveBeenCalledWith(
        'stats:online',
        expect.any(Number),
        '15'
      );
    });

    it('should use current timestamp for score', async () => {
      // Arrange
      const mockDate = new Date('2024-01-01T12:00:00.000Z');
      jest.setSystemTime(mockDate);
      const expectedTimestamp = mockDate.getTime();

      const sampleMethod = sampler['sample'].bind(sampler);

      // Act
      await sampleMethod();

      // Assert
      expect(redisService.zAdd).toHaveBeenCalledWith(
        'stats:online',
        expectedTimestamp,
        expect.any(String)
      );
    });
  });
});
