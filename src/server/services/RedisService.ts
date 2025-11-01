import { createClient, type RedisClientType } from 'redis';

import serverConfig from '../config';


/** Service to manage Redis connections and operations for the server. */
export class RedisService {
  private _client: RedisClientType | null = null;
  private isDevEnv = process.env['NODE_ENV'] === 'development';

  get client(): RedisClientType | undefined {
    if (!this._client && !this.isDevEnv) {
      throw new Error('Redis client is not connected');
    }
    return this._client ?? undefined;
  }

  /**
   * Connects to the Redis server using the provided URL.
   * In production, throws immediately on connection failure.
   * In development, logs error once and allows graceful degradation.
   * Should only be called once during application startup.
   */
  async connect(redisURL?: string): Promise<void> {
    if (this._client) {
      return;
    }

    if (!redisURL) {
      const error = 'Failed to connect to Redis: REDIS_URL is not defined.';
      if (this.isDevEnv) {
        console.error(error);
        return;
      }
      throw new Error(error);
    }

    this._client = createClient({ 
      url: redisURL,
      pingInterval: serverConfig.redis.pingInterval
    });

    this.client!.on('connect', () => {
      console.log('Redis Client Connected');
    });

    try {
      await this.client!.connect();
      this.client!.on('error', err => {
        console.error('Redis Client Error:', err);
      });
    } catch (err) {
      if (this.isDevEnv) {
        console.error('Failed to connect to Redis. Continuing in degraded mode.');
        this._client = null;
      } else {
        throw err;
      }
    }
  }

  async disconnect(): Promise<void> {
    await this.client?.quit();
    this._client = null;
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    await this.client?.set(key, value, options);
  }

  async get(key: string): Promise<string | null> {
    return await this.client?.get(key) ?? null;
  }

  async delete(key: string): Promise<number> {
    return await this.client?.del(key) ?? 0;
  }

  async setStartupTime(): Promise<void> {
    const now = new Date().toISOString();
    await this.set('server:startup', now);
    if (this.client) {
      console.log(`Server startup time logged: ${now}`);
    }
  }

  /**
   * Add a member with a score to a sorted set.
   * @param key Redis key for the sorted set
   * @param score Numeric score for the member
   * @param member Member value to add
   * @returns Number of elements added (0 if member already existed with same score)
   */
  async zAdd(key: string, score: number, member: string): Promise<number> {
    return await this.client?.zAdd(key, { score, value: member }) ?? 0;
  }

  /**
   * Get members from a sorted set within a score range.
   * @param key Redis key for the sorted set
   * @param min Minimum score (inclusive)
   * @param max Maximum score (inclusive)
   * @returns Array of members with their scores
   */
  async zRangeByScoreWithScores(
    key: string,
    min: number,
    max: number
  ): Promise<Array<{ value: string; score: number }>> {
    return await this.client?.zRangeByScoreWithScores(key, min, max) ?? [];
  }
}

const redisService = new RedisService();
export default redisService;
