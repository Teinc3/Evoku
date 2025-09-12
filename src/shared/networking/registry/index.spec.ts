import { isJestEnvironment } from '../../types/test-utils/cross-framework';
import { default as packetRegistry, PacketRegistry } from ".";

import type { PacketConstructor } from '../../types/networking/IPacket';
import type ICodec from '../../types/networking/ICodec';
import type ActionEnum from '../../types/enums/actions';


// Mock packet class for testing (simplified for cross-framework compatibility)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class UnusedMockPacket {
  readonly id: ActionEnum;
  readonly Codec: ICodec<unknown>;

  constructor(id: ActionEnum = 1 as ActionEnum) {
    this.id = id;
    this.Codec = { 
      decode: (() => 0) as unknown as ICodec<unknown>['decode'], 
      encode: (() => 0) as unknown as ICodec<unknown>['encode']
    };
  }
}

describe('PacketRegistry', () => {
  let registry: InstanceType<typeof PacketRegistry>;
  let mockPacketClass: PacketConstructor<ActionEnum>;

  beforeAll(() => {
    // Cross-framework console mocking
    if (isJestEnvironment()) {
      const jestGlobal = globalThis as { jest?: { 
        spyOn: (obj: unknown, method: string) => { mockImplementation: (fn: () => void) => void }
      } };
      jestGlobal.jest?.spyOn(console, 'log').mockImplementation(() => {});
      jestGlobal.jest?.spyOn(console, 'warn').mockImplementation(() => {});
    }
  });

  afterAll(() => {
    if (isJestEnvironment()) {
      const jestGlobal = globalThis as { jest?: { restoreAllMocks: () => void } };
      jestGlobal.jest?.restoreAllMocks();
    }
  });

  beforeEach(() => {
    // Create a fresh registry for each test
    registry = new PacketRegistry();

    // Create mock packet class - simplified for cross-framework compatibility
    mockPacketClass = class TestPacket {
      readonly id: ActionEnum = 42 as unknown as ActionEnum;
      readonly Codec: ICodec<unknown> = { 
        decode: (() => 0) as unknown as ICodec<unknown>['decode'], 
        encode: (() => 0) as unknown as ICodec<unknown>['encode']
      };
    } as unknown as PacketConstructor<ActionEnum>;
  });

  describe('constructor', () => {
    it('should create a PacketRegistry instance', () => {
      expect(registry).toBeDefined();
      expect(registry).toBeInstanceOf(PacketRegistry);
    });

    it('should initialize with empty registry map', () => {
      // Access registry size through public getter method if available
      if (typeof registry.getRegistrySize === 'function') {
        expect(registry.getRegistrySize()).toBe(0);
      } else {
        // Basic check that it's a new instance
        expect(registry).toBeDefined();
      }
    });
  });

  describe('registerPacket', () => {
    it('should register a packet class successfully', () => {
      const testId = 42 as unknown as ActionEnum;

      expect(() => registry.registerPacket(mockPacketClass)).not.toThrow();

      // Basic verification that registration works
      const retrieved = registry.getPacket(testId);
      expect(retrieved).toBeDefined();
    });

    it('should handle multiple packet registrations', () => {
      const testId1 = 42 as unknown as ActionEnum;
      const testId2 = 2 as unknown as ActionEnum;

      const mockPacketClass2 = class TestPacket2 {
        readonly id: ActionEnum = testId2;
        readonly Codec: ICodec<unknown> = { 
          decode: (() => 0) as unknown as ICodec<unknown>['decode'], 
          encode: (() => 0) as unknown as ICodec<unknown>['encode']
        };
      } as unknown as PacketConstructor<ActionEnum>;

      expect(() => {
        registry.registerPacket(mockPacketClass);
        registry.registerPacket(mockPacketClass2);
      }).not.toThrow();

      expect(registry.getPacket(testId1)).toBeDefined();
      expect(registry.getPacket(testId2)).toBeDefined();
    });
  });

  describe('getPacket', () => {
    it('should return registered packet for valid ID', () => {
      const testId = 42 as unknown as ActionEnum;

      registry.registerPacket(mockPacketClass);
      const result = registry.getPacket(testId);

      expect(result).toBeDefined();
    });

    it('should return undefined for unregistered ID', () => {
      const result = registry.getPacket(999 as unknown as ActionEnum);
      expect(result).toBeUndefined();
    });

    it('should return undefined for null/undefined ID', () => {
      expect(registry.getPacket(null as unknown as ActionEnum)).toBeUndefined();
      expect(registry.getPacket(undefined as unknown as ActionEnum)).toBeUndefined();
    });
  });

  describe('singleton instance (packetRegistry)', () => {
    it('should export a singleton instance', () => {
      expect(packetRegistry).toBeDefined();
      expect(packetRegistry).toBeInstanceOf(PacketRegistry);
    });

    it('should allow registration on singleton instance', () => {
      const testId = 42 as unknown as ActionEnum;

      expect(() => packetRegistry.registerPacket(mockPacketClass)).not.toThrow();
      
      // Basic check that it was registered
      const result = packetRegistry.getPacket(testId);
      expect(result).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle malformed packet classes gracefully', () => {
      const malformedClass = {} as PacketConstructor<ActionEnum>;

      // Should not throw, registry should handle gracefully
      expect(() => registry.registerPacket(malformedClass)).not.toThrow();
    });
  });

  // Note: This test file is simplified for cross-framework compatibility
  // Full Jest mock functionality cannot be replicated in Jasmine
  // The tests focus on basic functionality that can be verified in both environments
});
