import { createClient, type RedisClientType } from 'redis';

import serverConfig from '../config';


/** Service to manage Redis connections and operations for the server. */
export class RedisService {
  private _client: RedisClientType | null = null;
  private _connectionErrorLogged = false;
  private _isDevelopment = process.env['NODE_ENV'] === 'development';

  get client(): RedisClientType {
    if (!this._client) {
      throw new Error('Redis client is not connected');
    }
    return this._client;
  }

  private get isConnected(): boolean {
    return this._client !== null;
  }

  /**
   * Connects to the Redis server using the provided URL.
   * In production, throws immediately on connection failure.
   * In development, logs a single error and allows graceful degradation.
   */
  async connect(redisURL?: string): Promise<void> {
    if (this._client) {
      return;
    }

    if (!redisURL) {
      const error = 'Failed to connect to Redis: REDIS_URL is not defined.';
      if (this._isDevelopment) {
        if (!this._connectionErrorLogged) {
          console.error(error);
          this._connectionErrorLogged = true;
        }
        return;
      }
      throw new Error(error);
    }

    this._client = createClient({ 
      url: redisURL,
      pingInterval: serverConfig.redis.pingInterval
    });

    this._client.on('error', err => {
      if (!this._connectionErrorLogged) {
        console.error('Redis Client Error:', err);
        this._connectionErrorLogged = true;
      }
    });

    this._client.on('connect', () => {
      console.log('Redis Client Connected');
      this._connectionErrorLogged = false;
    });

    try {
      await this._client.connect();
    } catch (err) {
      if (this._isDevelopment) {
        if (!this._connectionErrorLogged) {
          console.error('Failed to connect to Redis:', err);
          this._connectionErrorLogged = true;
        }
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
    if (!this.isConnected) {
      if (this._isDevelopment) {
        return;
      }
      throw new Error('Redis client is not connected');
    }
    await this.client.set(key, value, options);
  }

  async get(key: string): Promise<string | null> {
    if (!this.isConnected) {
      if (this._isDevelopment) {
        return null;
      }
      throw new Error('Redis client is not connected');
    }
    return this.client.get(key);
  }

  async delete(key: string): Promise<number> {
    if (!this.isConnected) {
      if (this._isDevelopment) {
        return 0;
      }
      throw new Error('Redis client is not connected');
    }
    return this.client.del(key);
  }

  async setStartupTime(): Promise<void> {
    if (!this.isConnected) {
      if (this._isDevelopment) {
        return;
      }
      throw new Error('Redis client is not connected');
    }
    const now = new Date().toISOString();
    await this.set('server:startup', now);
    console.log(`Server startup time logged: ${now}`);
  }
}

const redisService = new RedisService();
export default redisService;