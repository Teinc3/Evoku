import { createClient, type RedisClientType } from 'redis';

import { RedisService } from './RedisService';


// Mock the redis module
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
          pingInterval: expect.any(Number)
        });
        expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mockClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockClient.connect).toHaveBeenCalled();
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
          pingInterval: expect.any(Number)
        });
        expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
        expect(mockClient.on).toHaveBeenCalledWith('connect', expect.any(Function));
        expect(mockClient.connect).toHaveBeenCalled();
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

      it('should not log error twice if connect fails multiple times', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

        await service.connect();
        await service.connect();

        expect(consoleSpy).toHaveBeenCalledTimes(1);

        consoleSpy.mockRestore();
      });

      it('should handle connection failure gracefully', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const connectionError = new Error('ECONNREFUSED');
        mockClient.connect = jest.fn().mockRejectedValue(connectionError);

        await service.connect('redis://localhost:6379');

        expect(consoleSpy).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith('Failed to connect to Redis:', connectionError);
        expect(service['_client']).toBeNull();

        consoleSpy.mockRestore();
      });

      it('should only log connection error once on repeated failures', async () => {
        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const connectionError = new Error('ECONNREFUSED');
        mockClient.connect = jest.fn().mockRejectedValue(connectionError);

        await service.connect('redis://localhost:6379');
        await service.connect('redis://localhost:6379');

        expect(consoleSpy).toHaveBeenCalledTimes(1);

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
      const connectCallback = connectCall[1];
      connectCallback();

      expect(consoleSpy).toHaveBeenCalledWith('Redis Client Connected');

      consoleSpy.mockRestore();
    });

    it('should reset error flag on successful reconnection', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.connect('redis://localhost:6379');

      service['_connectionErrorLogged'] = true;

      const connectCall = (mockClient.on as jest.Mock).mock.calls.find(
        (call: [string, () => void]) => call[0] === 'connect'
      );
      const connectCallback = connectCall[1];
      connectCallback();

      expect(service['_connectionErrorLogged']).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should only log error event once', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.connect('redis://localhost:6379');

      const errorCall = (mockClient.on as jest.Mock).mock.calls.find(
        (call: [string, (error: Error) => void]) => call[0] === 'error'
      );
      const errorCallback = errorCall[1];
      const testError = new Error('test error');
      
      errorCallback(testError);
      errorCallback(testError);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy).toHaveBeenCalledWith('Redis Client Error:', testError);

      consoleSpy.mockRestore();
    });
  });

  describe('disconnect', () => {
    it('should quit client and set to null if connected', async () => {
      service['_client'] = mockClient;

      await service.disconnect();

      expect(mockClient.quit).toHaveBeenCalled();
      expect(service['_client']).toBeNull();
    });

    it('should do nothing if not connected', async () => {
      await service.disconnect();

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