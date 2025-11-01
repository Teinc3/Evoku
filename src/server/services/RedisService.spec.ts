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
      on: jest.fn(),
      zAdd: jest.fn().mockResolvedValue(1),
      zRangeByScoreWithScores: jest.fn().mockResolvedValue([]),
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

  describe('zAdd', () => {
    describe('in production', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'production';
        service = new RedisService();
      });

      it('should call client.zAdd with correct parameters when connected', async () => {
        service['_client'] = mockClient;

        const result = await service.zAdd('stats:online', 1234567890, '42');

        expect(mockClient.zAdd).toHaveBeenCalledWith(
          'stats:online',
          { score: 1234567890, value: '42' }
        );
        expect(result).toBe(1);
      });

      it('should throw if not connected', async () => {
        await expect(service.zAdd('key', 1, 'value')).rejects
          .toThrow('Redis client is not connected');
      });
    });

    describe('in development', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'development';
        service = new RedisService();
      });

      it('should call client.zAdd when connected', async () => {
        service['_client'] = mockClient;

        const result = await service.zAdd('stats:online', 1234567890, '42');

        expect(mockClient.zAdd).toHaveBeenCalledWith(
          'stats:online',
          { score: 1234567890, value: '42' }
        );
        expect(result).toBe(1);
      });

      it('should return 0 if not connected', async () => {
        const result = await service.zAdd('key', 1, 'value');

        expect(result).toBe(0);
        expect(mockClient.zAdd).not.toHaveBeenCalled();
      });
    });
  });

  describe('zRangeByScoreWithScores', () => {
    describe('in production', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'production';
        service = new RedisService();
      });

      it('should call client.zRangeByScoreWithScores with correct parameters', async () => {
        service['_client'] = mockClient;
        const mockData = [
          { value: '10', score: 1000 },
          { value: '20', score: 2000 }
        ];
        (mockClient.zRangeByScoreWithScores as jest.Mock).mockResolvedValue(mockData);

        const result = await service.zRangeByScoreWithScores('stats:online', 1000, 3000);

        expect(mockClient.zRangeByScoreWithScores).toHaveBeenCalledWith(
          'stats:online',
          1000,
          3000
        );
        expect(result).toEqual(mockData);
      });

      it('should throw if not connected', async () => {
        await expect(service.zRangeByScoreWithScores('key', 0, 100)).rejects
          .toThrow('Redis client is not connected');
      });
    });

    describe('in development', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'development';
        service = new RedisService();
      });

      it('should call client.zRangeByScoreWithScores when connected', async () => {
        service['_client'] = mockClient;
        const mockData = [{ value: '10', score: 1000 }];
        (mockClient.zRangeByScoreWithScores as jest.Mock).mockResolvedValue(mockData);

        const result = await service.zRangeByScoreWithScores('stats:online', 1000, 3000);

        expect(mockClient.zRangeByScoreWithScores).toHaveBeenCalledWith(
          'stats:online',
          1000,
          3000
        );
        expect(result).toEqual(mockData);
      });

      it('should return empty array if not connected', async () => {
        const result = await service.zRangeByScoreWithScores('key', 0, 100);

        expect(result).toEqual([]);
        expect(mockClient.zRangeByScoreWithScores).not.toHaveBeenCalled();
      });
    });
  });

  describe('setStartupTime', () => {
    describe('in production', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'production';
        service = new RedisService();
      });

      it('should set startup time and log when connected', async () => {
        service['_client'] = mockClient;
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await service.setStartupTime();

        expect(mockClient.set)
          .toHaveBeenCalledWith('server:startup', expect.any(String), undefined);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Server startup time logged:')
        );

        consoleSpy.mockRestore();
      });

      it('should throw if not connected', async () => {
        await expect(service.setStartupTime()).rejects.toThrow('Redis client is not connected');
      });
    });

    describe('in development', () => {
      beforeEach(() => {
        process.env['NODE_ENV'] = 'development';
        service = new RedisService();
      });

      it('should set startup time and log when connected', async () => {
        service['_client'] = mockClient;
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await service.setStartupTime();

        expect(mockClient.set)
          .toHaveBeenCalledWith('server:startup', expect.any(String), undefined);
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Server startup time logged:')
        );

        consoleSpy.mockRestore();
      });

      it('should silently fail if not connected', async () => {
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

        await expect(service.setStartupTime()).resolves.toBeUndefined();

        expect(mockClient.set).not.toHaveBeenCalled();
        expect(consoleSpy).not.toHaveBeenCalled();

        consoleSpy.mockRestore();
      });
    });
  });
});
