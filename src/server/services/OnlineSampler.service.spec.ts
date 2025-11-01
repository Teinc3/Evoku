import { jest } from '@jest/globals';

import { StatsSampler } from './OnlineSampler.service';

import type { StatsService } from './StatsService';


describe('StatsSampler', () => {
  let sampler: StatsSampler;
  let mockStatsService: StatsService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockStatsService = {
      sampleStats: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
    } as unknown as StatsService;

    sampler = new StatsSampler(mockStatsService);
  });

  afterEach(() => {
    sampler.stop();
    jest.useRealTimers();
  });

  describe('start', () => {
    it('should align to next hour boundary before first sample', () => {
      // Arrange - Set time to 12:34:45.500
      const mockDate = new Date('2024-01-01T12:34:45.500Z');
      jest.setSystemTime(mockDate);

      // Act
      sampler.start();

      // Expected delay: (60 - 34) * 60 * 1000 - 45 * 1000 - 500 = 1514500ms
      const expectedDelay = (60 - 34) * 60 * 1000 - 45 * 1000 - 500;
      jest.advanceTimersByTime(expectedDelay - 1);
      expect(mockStatsService.sampleStats).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      expect(mockStatsService.sampleStats).toHaveBeenCalledTimes(1);
    });

    it('should sample every hour after alignment', () => {
      // Arrange
      const mockDate = new Date('2024-01-01T12:00:00.000Z');
      jest.setSystemTime(mockDate);

      // Act
      sampler.start();

      // Advance to first sample (at next hour)
      jest.advanceTimersByTime(3600_000);
      expect(mockStatsService.sampleStats).toHaveBeenCalledTimes(1);

      // Advance another hour
      jest.advanceTimersByTime(3600_000);
      expect(mockStatsService.sampleStats).toHaveBeenCalledTimes(2);

      // Advance another hour
      jest.advanceTimersByTime(3600_000);
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
