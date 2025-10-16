import { createClient, type RedisClientType } from 'redis';


/** Service to manage Redis connections and operations for the server. */
export class RedisService {
  private _client: RedisClientType | null = null;

  get client(): RedisClientType {
    if (!this._client) {
      throw new Error('Redis client is not connected');
    }
    return this._client;
  }

  /**
   * Connects to the Redis server using the provided URL.
   * If connection fails, an error is thrown.
   */
  async connect(redisURL?: string): Promise<void> {
    if (this._client) {
      return;
    }

    if (!redisURL) {
      throw new Error('Failed to connect to Redis: REDIS_URL is not defined.');
    }

    this._client = createClient({ url: redisURL });

    this.client.on('error', err => {
      console.error('Redis Client Error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis Client Connected');
    });

    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    if (this._client) {
      await this._client.quit();
      this._client = null;
    }
  }

  async set(key: string, value: string, options?: { EX?: number }): Promise<void> {
    await this.client.set(key, value, options);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async delete(key: string): Promise<number> {
    return this.client.del(key);
  }

  async setStartupTime(): Promise<void> {
    const now = new Date().toISOString();
    await this.set('server:startup', now);
    console.log(`Server startup time logged: ${now}`);
  }
}

const redisService = new RedisService();
export default redisService;