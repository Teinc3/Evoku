import PacketIO from './PacketIO';
import PacketBuffer from './PacketBuffer';
import packetRegistry from '../registry';
import LifecycleActions from '../../types/enums/actions/match/lifecycle';

import type ActionEnum from '../../types/enums/actions';


// Mock dependencies
const mockDecodeMethod = jest.fn(() => LifecycleActions.GAME_INIT);
const mockPacketBuffer = {
  write: jest.fn(),
  index: 0,
  buffer: new ArrayBuffer(10)
};

jest.mock('./PacketBuffer', () => {
  return jest.fn().mockImplementation(() => mockPacketBuffer);
});

jest.mock('../registry', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    registerPacket: jest.fn(),
    getPacket: jest.fn()
  },
  PacketRegistry: jest.fn()
}));

jest.mock('../codecs/custom/ActionCodec', () => {
  return jest.fn().mockImplementation(() => ({
    decode: mockDecodeMethod
  }));
});


describe('PacketIO', () => {
  let packetIO: PacketIO;
  let mockPacketBuffer: {
    buffer: Uint8Array;
    index: number;
    write: jest.MockedFunction<(buffer: ArrayBuffer) => void>;
  };
  let mockPacket: {
    wrap: jest.MockedFunction<() => { buffer: ArrayBuffer; nonResizeableBuffer: ArrayBuffer }>;
    unwrap: jest.MockedFunction<() => unknown>;
  };
  let mockPacketClass: jest.MockedFunction<(...args: unknown[]) => typeof mockPacket>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Fresh mock setup for each test
    mockPacketBuffer = {
      buffer: new Uint8Array(10),
      index: 0,
      write: jest.fn()
    };
    
    mockPacket = {
      wrap: jest.fn().mockReturnValue({ 
        buffer: new ArrayBuffer(10),
        nonResizeableBuffer: new ArrayBuffer(10)
      }),
      unwrap: jest.fn()
    };
    
    mockPacketClass = jest.fn().mockImplementation(() => mockPacket);
    
    // Reset and setup all mocks
    (PacketBuffer as jest.Mock).mockImplementation(() => mockPacketBuffer);
    (packetRegistry.getPacket as jest.Mock).mockReturnValue(mockPacketClass);
    
    packetIO = new PacketIO();
  });

  describe('constructor', () => {
    it('should create PacketIO instance', () => {
      expect(packetIO).toBeDefined();
      expect(packetIO).toBeInstanceOf(PacketIO);
    });
  });

  describe('decodePacket', () => {
    it('should decode packet successfully', () => {
      const buffer = new ArrayBuffer(10);
      const unwrappedData = { test: 'data' };
      mockPacket.unwrap.mockReturnValue(unwrappedData);
      
      const result = packetIO.decodePacket(buffer);
      
      expect(result).toBe(unwrappedData);
      expect(PacketBuffer).toHaveBeenCalledWith(10);
      expect(mockPacketBuffer.write).toHaveBeenCalledWith(buffer);
      expect(mockDecodeMethod).toHaveBeenCalledWith(mockPacketBuffer);
      expect(packetRegistry.getPacket).toHaveBeenCalledWith(LifecycleActions.GAME_INIT);
      expect(mockPacketClass).toHaveBeenCalled();
      expect(mockPacket.unwrap).toHaveBeenCalledWith(mockPacketBuffer);
    });

    it('should reset buffer index before packet unwrapping', () => {
      const buffer = new ArrayBuffer(10);
      const unwrappedData = { test: 'data' };
      mockPacket.unwrap.mockReturnValue(unwrappedData);
      mockPacketBuffer.index = 5; // Set to non-zero
      
      packetIO.decodePacket(buffer);

      expect(mockPacketBuffer.index).toBe(0);
      expect(mockPacket.unwrap).toHaveBeenCalledWith(mockPacketBuffer);
    });

    it('should throw error for unregistered action', () => {
      (packetRegistry.getPacket as jest.Mock).mockReturnValue(null);
      const buffer = new ArrayBuffer(10);

      expect(() => packetIO.decodePacket(buffer)).toThrow(
        `No packet registered for action: ${LifecycleActions.GAME_INIT}`
      );
    });

    it('should handle empty buffer', () => {
      const buffer = new ArrayBuffer(0);
      
      packetIO.decodePacket(buffer);

      expect(PacketBuffer).toHaveBeenCalledWith(0);
      expect(mockPacketBuffer.write).toHaveBeenCalledWith(buffer);
    });

    it('should handle large buffer', () => {
      const buffer = new ArrayBuffer(1000);
      
      packetIO.decodePacket(buffer);

      expect(PacketBuffer).toHaveBeenCalledWith(1000);
      expect(mockPacketBuffer.write).toHaveBeenCalledWith(buffer);
    });

    it('should handle action codec errors gracefully', () => {
      mockDecodeMethod.mockImplementationOnce(() => {
        throw new Error('Decode error');
      });

      const buffer = new ArrayBuffer(10);

      expect(() => packetIO.decodePacket(buffer)).toThrow('Decode error');
    });

    it('should handle packet unwrap errors gracefully', () => {
      mockPacket.unwrap.mockImplementation(() => {
        throw new Error('Unwrap error');
      });

      const buffer = new ArrayBuffer(10);

      expect(() => packetIO.decodePacket(buffer)).toThrow('Unwrap error');
    });
  });

  describe('encodePacket', () => {
    it('should encode packet successfully', () => {
      const action = LifecycleActions.GAME_INIT as ActionEnum;
      const dataContract = { data: 'test' };
      
      const result = packetIO.encodePacket(action, dataContract);

      expect(packetRegistry.getPacket).toHaveBeenCalledWith(action);
      expect(mockPacketClass).toHaveBeenCalledWith({
        action,
        data: 'test'
      });
      expect(mockPacket.wrap).toHaveBeenCalled();
      expect(result).toBeInstanceOf(ArrayBuffer);
    });

    it('should throw error for unregistered action', () => {
      (packetRegistry.getPacket as jest.Mock).mockReturnValue(null);
      const action = -999 as ActionEnum; // Non-existent action ID
      const dataContract = { data: 'test' };

      expect(() => packetIO.encodePacket(action, dataContract)).toThrow(
        'No packet registered for action: -999'
      );
    });

    it('should handle empty data contract', () => {
      const action = LifecycleActions.GAME_INIT as ActionEnum;
      const dataContract = {};
      
      packetIO.encodePacket(action, dataContract);

      expect(mockPacketClass).toHaveBeenCalledWith({
        action
      });
    });

    it('should handle complex data contract', () => {
      const action = LifecycleActions.GAME_INIT as ActionEnum;
      const dataContract = {
        nested: { data: 'test' },
        array: [1, 2, 3],
        number: 42,
        boolean: true
      };
      
      packetIO.encodePacket(action, dataContract);

      expect(mockPacketClass).toHaveBeenCalledWith({
        action,
        nested: { data: 'test' },
        array: [1, 2, 3],
        number: 42,
        boolean: true
      });
    });

    it('should handle packet wrap errors gracefully', () => {
      mockPacket.wrap.mockImplementation(() => {
        throw new Error('Wrap error');
      });

      const action = LifecycleActions.GAME_INIT as ActionEnum;
      const dataContract = { data: 'test' };

      expect(() => packetIO.encodePacket(action, dataContract)).toThrow('Wrap error');
    });

    it('should handle packet constructor errors gracefully', () => {
      // Override just for this test
      const errorMockClass = jest.fn().mockImplementation(() => {
        throw new Error('Constructor error');
      });
      (packetRegistry.getPacket as jest.Mock).mockReturnValueOnce(errorMockClass);

      const action = LifecycleActions.GAME_INIT as ActionEnum;
      const dataContract = { data: 'test' };

      expect(() => packetIO.encodePacket(action, dataContract)).toThrow('Constructor error');
    });
  });

  describe('integration scenarios', () => {
    it('should handle round-trip encoding and decoding', () => {
      const action = LifecycleActions.GAME_INIT as ActionEnum;
      const originalData = { message: 'hello', value: 42 };
      
      // Setup mocks for encoding
      const encodedBuffer = new ArrayBuffer(20);
      mockPacket.wrap.mockReturnValue({ 
        buffer: encodedBuffer,
        nonResizeableBuffer: encodedBuffer
      });
      
      // Setup mocks for decoding
      mockPacket.unwrap.mockReturnValue({ action: LifecycleActions.GAME_INIT, ...originalData });
      
      // Encode
      const encoded = packetIO.encodePacket(action, originalData);
      expect(encoded).toBe(encodedBuffer);
      
      // Decode
      const decoded = packetIO.decodePacket(encoded);
      expect(decoded).toEqual({ action: LifecycleActions.GAME_INIT, message: 'hello', value: 42 });
    });

    it('should handle multiple sequential operations', () => {
      const actions = [
        LifecycleActions.GAME_INIT,
        LifecycleActions.GAME_OVER,
        LifecycleActions.GAME_INIT
      ] as ActionEnum[];
      const dataContracts = [
        { data: 'first' },
        { data: 'second' },
        { data: 'third' }
      ];
      
      actions.forEach((action, index) => {
        const result = packetIO.encodePacket(action, dataContracts[index]);
        expect(result).toBeInstanceOf(ArrayBuffer);
      });
      
      expect(mockPacketClass).toHaveBeenCalledTimes(3);
    });

    it('should maintain consistency across operations', () => {
      const action = LifecycleActions.GAME_OVER as ActionEnum;
      const dataContract = { consistent: true };
      
      // First encode
      packetIO.encodePacket(action, dataContract);
      
      // Second encode with same data
      packetIO.encodePacket(action, dataContract);
      
      expect(mockPacketClass).toHaveBeenCalledTimes(2);
      expect(mockPacketClass).toHaveBeenNthCalledWith(1, { action, consistent: true });
      expect(mockPacketClass).toHaveBeenNthCalledWith(2, { action, consistent: true });
    });
  });

  describe('error handling and edge cases', () => {
    it('should handle null buffer in decode', () => {
      expect(() => packetIO.decodePacket(null as unknown as ArrayBuffer)).toThrow();
    });

    it('should handle undefined buffer in decode', () => {
      expect(() => packetIO.decodePacket(undefined as unknown as ArrayBuffer)).toThrow();
    });

    it('should handle null action in encode', () => {
      (packetRegistry.getPacket as jest.Mock).mockReturnValue(null);
      const dataContract = { data: 'test' };
      
      expect(() => packetIO.encodePacket(null as unknown as ActionEnum, dataContract))
        .toThrow('No packet registered for action: null');
    });

    it('should handle undefined action in encode', () => {
      (packetRegistry.getPacket as jest.Mock).mockReturnValue(null);
      const dataContract = { data: 'test' };

      expect(() => packetIO.encodePacket(undefined as unknown as ActionEnum, dataContract))
        .toThrow('No packet registered for action: undefined');
    });

    it('should handle null data contract in encode', () => {
      const action = LifecycleActions.GAME_INIT as ActionEnum;
      
      packetIO.encodePacket(action, null as unknown as Record<string, unknown>);
      
      expect(mockPacketClass).toHaveBeenCalledWith({
        action,
        // null spreads to nothing, leaving just action
      });
    });

    it('should handle malformed packet buffer', () => {
      (PacketBuffer as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Buffer creation error');
      });
      
      const buffer = new ArrayBuffer(10);
      
      expect(() => packetIO.decodePacket(buffer)).toThrow('Buffer creation error');
    });

    it('should preserve original buffer content', () => {
      const originalBuffer = new ArrayBuffer(10);
      const view = new Uint8Array(originalBuffer);
      view[0] = 42;
      view[1] = 24;
      
      packetIO.decodePacket(originalBuffer);
      
      // Original buffer should remain unchanged
      expect(view[0]).toBe(42);
      expect(view[1]).toBe(24);
    });
  });

  describe('performance considerations', () => {
    it('should handle large data contracts efficiently', () => {
      const action = LifecycleActions.GAME_INIT as ActionEnum;
      const largeDataContract = {
        largeArray: new Array(1000).fill('data'),
        largeString: 'x'.repeat(10000),
        nestedData: {
          level1: {
            level2: {
              level3: 'deep'
            }
          }
        }
      };
      
      expect(() => packetIO.encodePacket(action, largeDataContract)).not.toThrow();
      expect(mockPacketClass).toHaveBeenCalledWith({
        action,
        ...largeDataContract
      });
    });

    it('should handle multiple concurrent operations', () => {
      const action = LifecycleActions.GAME_OVER as ActionEnum;
      const operations = Array.from({ length: 100 }, (_, i) => ({
        data: `concurrent_${i}`
      }));
      
      operations.forEach(dataContract => {
        expect(() => packetIO.encodePacket(action, dataContract)).not.toThrow();
      });
      
      expect(mockPacketClass).toHaveBeenCalledTimes(100);
    });
  });
});