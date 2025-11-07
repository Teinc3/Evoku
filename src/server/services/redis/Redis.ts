import { createClient, type RedisClientType } from 'redis';

import serverConfig from '../../config';


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

  async keys(pattern: string): Promise<string[]> {
    return await this.client?.keys(pattern) ?? [];
  }
}

const redisService = new RedisService();
export default redisService;
