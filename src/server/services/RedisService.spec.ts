import { createClient, type RedisClientType } from 'redis';

import { RedisService } from './RedisService';


jest.mock('node:fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue(JSON.stringify({
    redis: { pingInterval: 30000 }
  })),
}));

jest.mock('node:path', () => ({
  join: jest.fn().mockImplementation((...args) => args.join('/')),
}));

// Mock shared utils
jest.mock('@shared/utils/config', () => ({
  deepFreeze: (obj: unknown) => obj,
  deepMerge: (base: unknown, override: unknown) => ({ ...base as object, ...override as object }),
}));

jest.mock('redis', () => ({
  createClient: jest.fn(),
}));


describe('RedisService', () => {
  let service: RedisService;
  let mockClient: RedisClientType;
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env['NODE_ENV'];
    service = new RedisService();
    mockClient = {
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      set: jest.fn().mockResolvedValue(undefined),
      get: jest.fn().mockResolvedValue('value'),
      del: jest.fn().mockResolvedValue(1),
      keys: jest.fn().mockResolvedValue([]),
      on: jest.fn(),
    } as unknown as RedisClientType;
    (createClient as jest.Mock).mockReturnValue(mockClient);
  });

  afterEach(() => {
    process.env['NODE_ENV'] = originalEnv;
    jest.clearAllMocks();
  });

  describe('connect', () => {
    describe('in production', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'production';
        service = new RedisService();
      });

      it('should create and connect client with valid URL', async () => {
        await service.connect('redis://localhost:6379');

        expect(createClient).toHaveBeenCalledWith({
          url: 'redis://localhost:6379',
          pingInterval: 30000
        });
        expect(mockClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      });

      it('should throw if no URL provided', async () => {
        await expect(service.connect()).rejects
          .toThrow('Failed to connect to Redis: REDIS_URL is not defined.');
      });

      it('should throw on connection failure', async () => {
        const connectionError = new Error('Connection refused');
        mockClient.connect = jest.fn().mockRejectedValue(connectionError);

        await expect(service.connect('redis://localhost:6379')).rejects.toThrow(connectionError);
      });
    });

    describe('in development', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'development';
        service = new RedisService();
      });

      it('should create and connect client with valid URL', async () => {
        await service.connect('redis://localhost:6379');

        expect(createClient).toHaveBeenCalledWith({
          url: 'redis://localhost:6379',
          pingInterval: 30000
        });
        expect(mockClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockClient.connect).toHaveBeenCalled();
        expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
      });

      it('should log error once and continue if no URL provided', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await service.connect();

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to connect to Redis: REDIS_URL is not defined.'
        );
        expect(createClient).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
      });

      it('should handle connection failure gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const connectionError = new Error('ECONNREFUSED');
        mockClient.connect = jest.fn().mockRejectedValue(connectionError);

        await service.connect('redis://localhost:6379');

        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to connect to Redis. Continuing in degraded mode.'
        );
        expect(service['_client']).toBeNull();

        consoleSpy.mockRestore();
      });
    });

    it('should not reconnect if already connected', async () => {
      service['_client'] = mockClient;

      await service.connect('redis://localhost:6379');

      expect(createClient).not.toHaveBeenCalled();
      expect(mockClient.connect).not.toHaveBeenCalled();
    });

    it('should log on client connect event', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.connect('redis://localhost:6379');
      const connectCall = (mockClient.on as jest.Mock).mock.calls.find(
        (call: [string, () => void]) => call[0] === 'connect'
      );
      const connectCallback = connectCall![1];

      connectCallback();

      expect(consoleSpy).toHaveBeenCalledWith('Redis Client Connected');

      consoleSpy.mockRestore();
    });

    it('should log error events', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.connect('redis://localhost:6379');
      const errorCall = (mockClient.on as jest.Mock).mock.calls.find(
        (call: [string, (error: Error) => void]) => call[0] === 'error'
      );
      const errorCallback = errorCall![1];
      const testError = new Error('test error');

      errorCallback(testError);

      expect(consoleSpy).toHaveBeenCalledWith('Redis Client Error:', testError);

      consoleSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('should call client.quit and set client to null', async () => {
      service['_client'] = mockClient;

      await service.disconnect();

      expect(mockClient.quit).toHaveBeenCalled();
      expect(service['_client']).toBeNull();
    });

    it('should handle undefined client gracefully', async () => {
      process.env['NODE_ENV'] = 'development';
      const devService = new RedisService(); // Create new service with dev env
      await devService.disconnect();

      expect(mockClient.quit).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    describe('in production', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'production';
        service = new RedisService();
      });

      it('should call client.set with key and value when connected', async () => {
        service['_client'] = mockClient;

        await service.set('testKey', 'testValue', { EX: 60 });

        expect(mockClient.set).toHaveBeenCalledWith('testKey', 'testValue', { EX: 60 });
      });

      it('should throw if not connected', async () => {
        await expect(service.set('key', 'value')).rejects
          .toThrow('Redis client is not connected');
      });
    });

    describe('in development', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'development';
        service = new RedisService();
      });

      it('should call client.set with key and value when connected', async () => {
        service['_client'] = mockClient;

        await service.set('testKey', 'testValue', { EX: 60 });

        expect(mockClient.set).toHaveBeenCalledWith('testKey', 'testValue', { EX: 60 });
      });

      it('should silently fail if not connected', async () => {
        await expect(service.set('key', 'value')).resolves.toBeUndefined();
        expect(mockClient.set).not.toHaveBeenCalled();
      });
    });
  });

  describe('get', () => {
    describe('in production', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'production';
        service = new RedisService();
      });

      it('should call client.get and return value when connected', async () => {
        service['_client'] = mockClient;

        const result = await service.get('testKey');

        expect(mockClient.get).toHaveBeenCalledWith('testKey');
        expect(result).toBe('value');
      });

      it('should throw if not connected', async () => {
        await expect(service.get('key')).rejects.toThrow('Redis client is not connected');
      });
    });

    describe('in development', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'development';
        service = new RedisService();
      });

      it('should call client.get and return value when connected', async () => {
        service['_client'] = mockClient;

        const result = await service.get('testKey');

        expect(mockClient.get).toHaveBeenCalledWith('testKey');
        expect(result).toBe('value');
      });

      it('should return null if not connected', async () => {
        const result = await service.get('key');

        expect(result).toBeNull();
        expect(mockClient.get).not.toHaveBeenCalled();
      });
    });
  });

  describe('delete', () => {
    describe('in production', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'production';
        service = new RedisService();
      });

      it('should call client.del and return count when connected', async () => {
        service['_client'] = mockClient;

        const result = await service.delete('testKey');

        expect(mockClient.del).toHaveBeenCalledWith('testKey');
        expect(result).toBe(1);
      });

      it('should throw if not connected', async () => {
        await expect(service.delete('key')).rejects.toThrow('Redis client is not connected');
      });
    });

    describe('in development', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'development';
        service = new RedisService();
      });

      it('should call client.del and return count when connected', async () => {
        service['_client'] = mockClient;

        const result = await service.delete('testKey');

        expect(mockClient.del).toHaveBeenCalledWith('testKey');
        expect(result).toBe(1);
      });

      it('should return 0 if not connected', async () => {
        const result = await service.delete('key');

        expect(result).toBe(0);
        expect(mockClient.del).not.toHaveBeenCalled();
      });
    });
  });

  describe('keys', () => {
    describe('in production', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'production';
        service = new RedisService();
      });

      it('should call client.keys and return keys when connected', async () => {
        service['_client'] = mockClient;
        (mockClient.keys as jest.Mock).mockResolvedValueOnce(['key1', 'key2', 'key3']);

        const result = await service.keys('stats:*');

        expect(mockClient.keys).toHaveBeenCalledWith('stats:*');
        expect(result).toEqual(['key1', 'key2', 'key3']);
      });

      it('should throw if not connected', async () => {
        await expect(service.keys('pattern')).rejects.toThrow('Redis client is not connected');
      });
    });

    describe('in development', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'development';
        service = new RedisService();
      });

      it('should call client.keys and return keys when connected', async () => {
        service['_client'] = mockClient;
        (mockClient.keys as jest.Mock).mockResolvedValueOnce(['key1', 'key2']);

        const result = await service.keys('stats:*');

        expect(mockClient.keys).toHaveBeenCalledWith('stats:*');
        expect(result).toEqual(['key1', 'key2']);
      });

      it('should return empty array if not connected', async () => {
        const result = await service.keys('pattern');

        expect(result).toEqual([]);
      });
    });
  });
});

