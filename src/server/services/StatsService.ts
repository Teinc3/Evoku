import redisService from './RedisService';

import type SessionManager from '../managers/SessionManager';
import type RoomManager from '../managers/RoomManager';


/** Server statistics snapshot */
export interface IServerStats {
  /** Number of active sessions (online users) */
  activeSessions: number;
  /** Number of active rooms */
  activeRooms: number;
  /** Timestamp (epoch milliseconds) when stats were recorded */
  at: number;
}

/** Valid time ranges for stats query */
export type StatsRange = '1h' | '24h' | '7d';

/**
 * Service for collecting and retrieving server statistics.
 */
export class StatsService {
  private readonly redisKeyPrefix = 'stats:';

  constructor(
    private sessionManager: SessionManager,
    private roomManager: RoomManager
  ) {}

  /** Get current server statistics */
  public getCurrentStats(): IServerStats {
    return {
      activeSessions: this.sessionManager.getOnlineCount(),
      activeRooms: this.roomManager.getActiveRoomsCount(),
      at: Date.now(),
    };
  }

  /** Sample and persist current stats to Redis */
  public async sampleStats(): Promise<void> {
    const stats = this.getCurrentStats();
    const key = `${this.redisKeyPrefix}${stats.at}`;

    try {
      await redisService.set(key, JSON.stringify(stats));
    } catch (error) {
      console.error('Failed to persist stats to Redis:', error);
    }
  }

  /** Get historical stats for a given time range */
  public async getHistoricalStats(range: StatsRange): Promise<IServerStats[]> {
    const now = Date.now();
    let startTime: number;

    switch (range) {
      case '1h':
        startTime = now - 60 * 60 * 1000;
        break;
      case '24h':
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case '7d':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
    }

    // Get all keys matching the pattern and filter by timestamp
    const keys = await this.getStatsKeys(startTime, now);
    const stats: IServerStats[] = [];

    for (const key of keys) {
      const data = await redisService.get(key);
      if (data) {
        try {
          stats.push(JSON.parse(data));
        } catch (error) {
          console.error(`Failed to parse stats for key ${key}:`, error);
        }
      }
    }

    return stats.sort((a, b) => a.at - b.at);
  }

  /** Get stats keys within a time range */
  private async getStatsKeys(startTime: number, endTime: number): Promise<string[]> {
    // This is a simplified implementation
    // In production, you might want to use Redis SCAN with pattern matching
    // For now, we'll rely on the sampler creating keys at known intervals
    const keys: string[] = [];
    const intervalMs = 60_000; // 1 minute

    for (let time = startTime; time <= endTime; time += intervalMs) {
      // Round to nearest minute
      const roundedTime = Math.floor(time / intervalMs) * intervalMs;
      keys.push(`${this.redisKeyPrefix}${roundedTime}`);
    }

    return keys;
  }
}

export default StatsService;
