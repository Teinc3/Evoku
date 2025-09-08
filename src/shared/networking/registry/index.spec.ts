import { default as packetRegistry, PacketRegistry } from ".";

import type { PacketConstructor } from '../../types/networking/IPacket';
import type ICodec from '../../types/networking/ICodec';
import type ActionEnum from '../../types/enums/actions';


// Mock packet class for testing
class MockPacket {
  readonly id: ActionEnum;
  readonly Codec: ICodec<unknown>;

  constructor(id: ActionEnum = 1 as ActionEnum) {
    this.id = id;
    this.Codec = { decode: jest.fn(), encode: jest.fn() };
  }
}

describe('PacketRegistry', () => {
  let registry: InstanceType<typeof PacketRegistry>;
  let mockPacketClass: PacketConstructor<ActionEnum>;
  let mockPacketInstance: MockPacket;

  beforeAll(() => {
    // Mock console methods to prevent output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterAll(() => {
    // Restore console methods
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    // Create a fresh registry for each test
    registry = new PacketRegistry();

    // Create mock packet instance
    mockPacketInstance = new MockPacket(42 as unknown as ActionEnum);

    // Create mock packet class that returns the instance
    mockPacketClass = jest.fn().mockImplementation(() => {
      return mockPacketInstance;
    }) as unknown as PacketConstructor<ActionEnum>;
  });

  describe('constructor', () => {
    it('should create a PacketRegistry instance', () => {
      expect(registry).toBeDefined();
      expect(registry).toBeInstanceOf(PacketRegistry);
    });

    it('should initialize with empty registry map', () => {
      // Access registry size through public getter method
      expect(registry.getRegistrySize()).toBe(0);
    });
  });

  describe('registerPacket', () => {
    it('should register a packet class successfully', () => {
      const testId = 42 as unknown as ActionEnum;

      registry.registerPacket(mockPacketClass);

      // Verify the packet was registered by checking if we can retrieve it
      const retrieved = registry.getPacket(testId);
      expect(retrieved).toBe(mockPacketClass);
    });

    it('should handle multiple packet registrations', () => {
      const testId1 = 42 as unknown as ActionEnum;
      const testId2 = 2 as unknown as ActionEnum;

      const mockPacketInstance2 = new MockPacket(testId2);
      const mockPacketClass2 = jest.fn().mockImplementation(() => {
        return mockPacketInstance2;
      }) as unknown as PacketConstructor<ActionEnum>;

      registry.registerPacket(mockPacketClass);
      registry.registerPacket(mockPacketClass2);

      expect(registry.getPacket(testId1)).toBe(mockPacketClass);
      expect(registry.getPacket(testId2)).toBe(mockPacketClass2);
    });

    it('should overwrite existing registration with same ID', () => {
      const testId = 42 as unknown as ActionEnum;

      const mockPacketInstance2 = new MockPacket(testId);
      const mockPacketClass2 = jest.fn().mockImplementation(() => {
        return mockPacketInstance2;
      }) as unknown as PacketConstructor<ActionEnum>;

      // Register first packet
      registry.registerPacket(mockPacketClass);
      expect(registry.getPacket(testId)).toBe(mockPacketClass);

      // Register second packet with same ID
      registry.registerPacket(mockPacketClass2);
      expect(registry.getPacket(testId)).toBe(mockPacketClass2);
    });

    it('should handle packet constructor errors gracefully', () => {
      const errorPacketClass = jest.fn().mockImplementation(() => {
        throw new Error('Constructor error');
      }) as unknown as PacketConstructor<ActionEnum>;

      // Should not throw when registering a packet that errors during construction
      expect(() => registry.registerPacket(errorPacketClass)).not.toThrow();

      // The packet should not be registered due to the error
      expect(registry.getPacket(42 as unknown as ActionEnum)).toBeUndefined();
    });
  });

  describe('getPacket', () => {
    it('should return registered packet for valid ID', () => {
      const testId = 42 as unknown as ActionEnum;

      registry.registerPacket(mockPacketClass);
      const result = registry.getPacket(testId);

      expect(result).toBe(mockPacketClass);
    });

    it('should return undefined for unregistered ID', () => {
      const result = registry.getPacket(999 as unknown as ActionEnum);
      expect(result).toBeUndefined();
    });

    it('should return undefined for null/undefined ID', () => {
      expect(registry.getPacket(null as unknown as ActionEnum)).toBeUndefined();
      expect(registry.getPacket(undefined as unknown as ActionEnum)).toBeUndefined();
    });

    it('should handle zero as valid ID', () => {
      const zeroId = 0 as unknown as ActionEnum;
      const zeroPacketClass = jest.fn().mockImplementation(() => {
        return new MockPacket(zeroId);
      }) as unknown as PacketConstructor<ActionEnum>;

      registry.registerPacket(zeroPacketClass);
      expect(registry.getPacket(zeroId)).toBe(zeroPacketClass);
    });

    it('should handle negative IDs', () => {
      const negativeId = -1 as unknown as ActionEnum;
      const negativePacketClass = jest.fn().mockImplementation(() => {
        return new MockPacket(negativeId);
      }) as unknown as PacketConstructor<ActionEnum>;

      registry.registerPacket(negativePacketClass);
      expect(registry.getPacket(negativeId)).toBe(negativePacketClass);
    });
  });

  describe('registry state management', () => {
    it('should maintain separate state between instances', () => {
      const registry1 = new PacketRegistry();
      const registry2 = new PacketRegistry();

      const testId = 42 as unknown as ActionEnum;

      // Register in first registry
      registry1.registerPacket(mockPacketClass);

      // Second registry should not have the packet
      expect(registry1.getPacket(testId)).toBe(mockPacketClass);
      expect(registry2.getPacket(testId)).toBeUndefined();
    });
  });

  describe('singleton instance (packetRegistry)', () => {
    it('should export a singleton instance', () => {
      expect(packetRegistry).toBeDefined();
      expect(packetRegistry).toBeInstanceOf(PacketRegistry);
    });

    it('should allow registration on singleton instance', () => {
      const testId = 42 as unknown as ActionEnum;

      packetRegistry.registerPacket(mockPacketClass);
      expect(packetRegistry.getPacket(testId)).toBe(mockPacketClass);
    });
  });

  describe('type safety', () => {
    it('should maintain type safety with ActionEnum', () => {
      const action = 42 as unknown as ActionEnum;

      const typedPacketClass = jest.fn().mockImplementation(() => {
        return new MockPacket(action);
      }) as unknown as PacketConstructor<ActionEnum>;

      registry.registerPacket(typedPacketClass);
      const result = registry.getPacket(action);

      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle malformed packet classes', () => {
      const malformedClass = {} as PacketConstructor<ActionEnum>;

      // Should not throw, but also shouldn't register anything
      expect(() => registry.registerPacket(malformedClass)).not.toThrow();
    });

    it('should handle packets without id property', () => {
      const noIdPacket = jest.fn().mockImplementation(() => {
        return { Codec: {} }; // Missing id property
      }) as unknown as PacketConstructor<ActionEnum>;

      registry.registerPacket(noIdPacket);

      // Should not register due to missing id
      expect(registry.getPacket(42 as unknown as ActionEnum)).toBeUndefined();
    });

    it('should handle packets with invalid id types', () => {
      const invalidIdPacket = jest.fn().mockImplementation(() => {
        return { id: 'invalid', Codec: {} };
      }) as unknown as PacketConstructor<ActionEnum>;

      registry.registerPacket(invalidIdPacket);

      // The registry uses the id as a key, so it should still work
      expect(registry.getPacket('invalid' as unknown as ActionEnum)).toBe(invalidIdPacket);
    });
  });
});
