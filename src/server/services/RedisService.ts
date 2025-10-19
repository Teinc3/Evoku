import { createClient, type RedisClientType } from 'redis';

import serverConfig from '../config';


/** Service to manage Redis connections and operations for the server. */
export class RedisService {
  private _client: RedisClientType | null = null;
  private _isDevelopment = process.env['NODE_ENV'] === 'development';

  get client(): RedisClientType | undefined {
    if (!this._client && !this._isDevelopment) {
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
      if (this._isDevelopment) {
        console.error(error);
        return;
      }
      throw new Error(error);
    }

    this._client = createClient({ 
      url: redisURL,
      pingInterval: serverConfig.redis.pingInterval
    });

    this._client.on('error', err => {
      console.error('Redis Client Error:', err);
    });

    this._client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    try {
      await this._client.connect();
    } catch (err) {
      if (this._isDevelopment) {
        console.error('Failed to connect to Redis:', err);
        this._client = null;
      } else {
        throw err;
      }
    }
  }

  async disconnect(): Promise<void> {
    if (this._client) {
      await this._client.quit();
      this._client = null;
    }
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    await this.client?.set(key, value, options);
  }

  async get(key: string): Promise<string | null> {
    return (await this.client?.get(key)) ?? null;
  }

  async delete(key: string): Promise<number> {
    return (await this.client?.del(key)) ?? 0;
  }

  async setStartupTime(): Promise<void> {
    const now = new Date().toISOString();
    await this.set('server:startup', now);
    if (this.client) {
      console.log(`Server startup time logged: ${now}`);
    }
  }
}

const redisService = new RedisService();
export default redisService;