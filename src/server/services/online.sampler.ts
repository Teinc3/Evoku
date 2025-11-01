import redisService from './RedisService';

import type SessionManager from '../managers/SessionManager';


/**
 * Sampler service that periodically records online session counts to Redis.
 * Samples every minute at :00 seconds and stores data in a sorted set.
 */
export class OnlineSampler {
  private timer: NodeJS.Timeout | null = null;
  private readonly redisKey = 'stats:online';

  constructor(private sessionManager: SessionManager) {}

  /**
   * Start the sampler. It will align to the next minute boundary (:00 seconds)
   * and then sample every 60 seconds.
   */
  public start(): void {
    if (this.timer) {
      return; // Already running
    }

    // Calculate milliseconds until next :00 second
    const now = new Date();
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();

    // Wait until next :00, then start the interval
    setTimeout(() => {
      this.sample(); // Take first sample
      this.timer = setInterval(() => this.sample(), 60_000); // Then every 60s
    }, msUntilNextMinute);
  }

  /** Stop the sampler */
  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Take a sample and persist to Redis */
  private async sample(): Promise<void> {
    const count = this.sessionManager.getOnlineCount();
    const timestamp = Date.now();

    try {
      await redisService.zAdd(this.redisKey, timestamp, count.toString());
    } catch (error) {
      console.error('Failed to persist online count to Redis:', error);
    }
  }
}

export default OnlineSampler;
