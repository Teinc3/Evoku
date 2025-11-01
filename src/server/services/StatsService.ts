import { StatsRange } from '../types/stats/online';
import redisService from './RedisService';

import type { IServerStats } from '../types/stats/online';
import type SessionManager from '../managers/SessionManager';
import type RoomManager from '../managers/RoomManager';


/**
 * Service for collecting and retrieving server statistics.
 */
export class StatsService {
  private readonly redisKeyPrefix = 'stats:';
  private readonly serverStartTime: number;

  constructor(
    private sessionManager: SessionManager,
    private roomManager: RoomManager
  ) {
    this.serverStartTime = Date.now();
    this.logStartupTime();
  }

  /** Log server startup time to Redis */
  private async logStartupTime(): Promise<void> {
    try {
      const isoTime = new Date(this.serverStartTime).toISOString();
      await redisService.set('server:startup', isoTime);
      console.log(`Server startup time logged: ${isoTime}`);
    } catch (error) {
      console.error('Failed to log startup time to Redis:', error);
    }
  }

  /** Get current server statistics */
  public getCurrentStats(): IServerStats {
    const now = Date.now();
    return {
      activeSessions: this.sessionManager.getOnlineCount(),
      activeRooms: this.roomManager.getActiveRoomsCount(),
      uptime: now - this.serverStartTime,
      at: now,
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
  public async getHistoricalStats(range: StatsRange | string): Promise<IServerStats[]> {
    const now = Date.now();
    let startTime: number;

    switch (range) {
      case StatsRange.ONE_HOUR:
      case '1h':
        startTime = now - 60 * 60 * 1000;
        break;
      case StatsRange.ONE_DAY:
      case '1d':
        startTime = now - 24 * 60 * 60 * 1000;
        break;
      case StatsRange.ONE_WEEK:
      case '1w':
        startTime = now - 7 * 24 * 60 * 60 * 1000;
        break;
      default:
        throw new Error(`Invalid range: ${range}`);
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
    // Get all stats keys from Redis (max 200 for 7d worth of hourly data)
    const allKeys = await redisService.keys(`${this.redisKeyPrefix}*`);
    
    // Filter keys by timestamp range and limit to 200 most recent
    const filteredKeys = allKeys
      .map(key => {
        const timestamp = parseInt(key.replace(this.redisKeyPrefix, ''), 10);
        return { key, timestamp };
      })
      .filter(({ timestamp }) => 
        !isNaN(timestamp) && timestamp >= startTime && timestamp <= endTime
      )
      .sort((a, b) => b.timestamp - a.timestamp) // Sort descending
      .slice(0, 200) // Limit to 200 entries max
      .map(({ key }) => key);

    return filteredKeys;
  }
}

export default StatsService;
