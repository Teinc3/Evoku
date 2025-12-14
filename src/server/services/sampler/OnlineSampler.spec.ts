import { jest } from '@jest/globals';

import OnlineSampler from '.';

import type { StatsService } from '../stats';


describe('OnlineSampler', () => {
  let sampler: OnlineSampler;
  let mockStatsService: StatsService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockStatsService = {
      sampleStats: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    } as unknown as StatsService;

    sampler = new OnlineSampler(mockStatsService);
  });

  afterEach(() => {
    sampler.stop();
    jest.useRealTimers();
  });

  describe('start', () => {
    it('should align to next hour boundary before first sample', async () => {
      // Arrange - Set time to 12:34:45.500
      const mockDate = new Date('2024-01-01T12:34:45.500Z');
      jest.setSystemTime(mockDate);

      // Act
      sampler.start();

      await jest.advanceTimersToNextTimerAsync();
      expect(mockStatsService.sampleStats).toHaveBeenCalledTimes(1);

      // Interval should not fire until the following hour
      await jest.advanceTimersByTimeAsync(3_599_000);
      expect(mockStatsService.sampleStats).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(1_000);
      expect(mockStatsService.sampleStats).toHaveBeenCalledTimes(2);
    });

    it('should sample every hour after alignment', async () => {
      // Arrange
      const mockDate = new Date('2024-01-01T12:00:00.000Z');
      jest.setSystemTime(mockDate);

      // Act
      sampler.start();

      // Advance to first sample (at next hour)
      await jest.advanceTimersByTimeAsync(3600_000);
      expect(mockStatsService.sampleStats).toHaveBeenCalledTimes(1);

      // Advance another hour
      await jest.advanceTimersByTimeAsync(3600_000);
      expect(mockStatsService.sampleStats).toHaveBeenCalledTimes(2);

      // Advance another hour
      await jest.advanceTimersByTimeAsync(3600_000);
      expect(mockStatsService.sampleStats).toHaveBeenCalledTimes(3);
    });

    it('should not start if already running', () => {
      // Arrange
      const mockDate = new Date('2024-01-01T12:00:00.000Z');
      jest.setSystemTime(mockDate);
      
      sampler.start();
      // Advance time to ensure timer is set
      jest.advanceTimersByTime(3600_000);
      
      const firstTimer = sampler['timer'];
      expect(firstTimer).not.toBeNull();

      // Act - try to start again while running
      sampler.start();

      // Assert - timer should be the same (not recreated)
      expect(sampler['timer']).toBe(firstTimer);
    });
  });

  describe('stop', () => {
    it('should clear the timer', () => {
      // Arrange
      const mockDate = new Date('2024-01-01T12:00:00.000Z');
      jest.setSystemTime(mockDate);
      sampler.start();
      
      // Advance to when timer is set (after alignment)
      jest.advanceTimersByTime(3600_000);
      expect(sampler['timer']).not.toBeNull();

      // Act
      sampler.stop();

      // Assert
      expect(sampler['timer']).toBeNull();
    });

    it('should stop sampling after stop is called', () => {
      // Arrange
      const mockDate = new Date('2024-01-01T12:00:00.000Z');
      jest.setSystemTime(mockDate);
      sampler.start();

      // Act - Advance to first sample
      jest.advanceTimersByTime(3600_000);
      expect(mockStatsService.sampleStats).toHaveBeenCalledTimes(1);

      sampler.stop();

      // Advance more time - should not sample anymore
      jest.advanceTimersByTime(3600_000);
      expect(mockStatsService.sampleStats).toHaveBeenCalledTimes(1);
    });

    it('should handle being called when not running', () => {
      // Act & Assert - Should not throw
      expect(() => sampler.stop()).not.toThrow();
    });
  });
});
