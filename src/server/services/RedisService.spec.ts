import { createClient, type RedisClientType } from 'redis';

import { RedisService } from './RedisService';


// Mock the redis module
jest.mock('redis', () => ({
  createClient: jest.fn(),
}));

describe('RedisService', () => {
  let service: RedisService;
  let mockClient: RedisClientType;

  beforeEach(() => {
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
    jest.clearAllMocks();
  });

  describe('connect', () => {
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

    it('should not reconnect if already connected', async () => {
      service['_client'] = mockClient; // Simulate connected state

      await service.connect('redis://localhost:6379');

      expect(createClient).not.toHaveBeenCalled();
      expect(mockClient.connect).not.toHaveBeenCalled();
    });

    it('should throw if no URL provided', async () => {
      await expect(service.connect()).rejects
        .toThrow('Failed to connect to Redis: REDIS_URL is not defined.');
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

    it('should log error on client error event', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      await service.connect('redis://localhost:6379');

      const errorCall = (mockClient.on as jest.Mock).mock.calls.find(
        (call: [string, (error: Error) => void]) => call[0] === 'error'
      );
      const errorCallback = errorCall[1];
      const testError = new Error('test error');
      errorCallback(testError);

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
    it('should call client.set with key and value', async () => {
      service['_client'] = mockClient;

      await service.set('testKey', 'testValue', { EX: 60 });

      expect(mockClient.set).toHaveBeenCalledWith('testKey', 'testValue', { EX: 60 });
    });

    it('should throw if not connected', async () => {
      await expect(service.set('key', 'value')).rejects
        .toThrow('Redis client is not connected');
    });
  });

  describe('get', () => {
    it('should call client.get and return value', async () => {
      service['_client'] = mockClient;

      const result = await service.get('testKey');

      expect(mockClient.get).toHaveBeenCalledWith('testKey');
      expect(result).toBe('value');
    });

    it('should throw if not connected', async () => {
      await expect(service.get('key')).rejects.toThrow('Redis client is not connected');
    });
  });

  describe('delete', () => {
    it('should call client.del and return count', async () => {
      service['_client'] = mockClient;

      const result = await service.delete('testKey');

      expect(mockClient.del).toHaveBeenCalledWith('testKey');
      expect(result).toBe(1);
    });

    it('should throw if not connected', async () => {
      await expect(service.delete('key')).rejects.toThrow('Redis client is not connected');
    });
  });

  describe('setStartupTime', () => {
    it('should set startup time and log', async () => {
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
});