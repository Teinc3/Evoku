import PacketBuffer from '../../utils/PacketBuffer';
import ShortCodec from './ShortCodec';

import type IPacketBuffer from '../../../types/networking/IPacketBuffer';


describe('ShortCodec', () => {
  let codec: ShortCodec;
  let buffer: IPacketBuffer;

  beforeEach(() => {
    codec = new ShortCodec();
    buffer = new PacketBuffer();
  });

  describe('Encode/Decode', () => {
    it('should encode and decode positive shorts', () => {
      const testValue = 1234;
      const bytesWritten = codec.encode(buffer, testValue);
      
      expect(bytesWritten).toBe(2);
      expect(buffer.index).toBe(2);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(testValue);
      expect(buffer.index).toBe(2);
    });

    it('should encode and decode negative shorts', () => {
      const testValue = -5678;
      const bytesWritten = codec.encode(buffer, testValue);
      
      expect(bytesWritten).toBe(2);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(testValue);
    });

    it('should handle zero correctly', () => {
      const testValue = 0;
      codec.encode(buffer, testValue);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(testValue);
    });

    it('should handle maximum 16-bit signed short', () => {
      const maxShort = 32767;
      codec.encode(buffer, maxShort);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(maxShort);
    });

    it('should handle minimum 16-bit signed short', () => {
      const minShort = -32768;
      codec.encode(buffer, minShort);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(minShort);
    });

    it('should handle multiple shorts in sequence', () => {
      const testValues = [1, -1, 100, -100, 32767, -32768];
      let totalBytes = 0;
      
      // Encode all values
      for (const value of testValues) {
        totalBytes += codec.encode(buffer, value);
      }
      
      expect(totalBytes).toBe(testValues.length * 2);
      
      // Decode all values
      buffer.index = 0;
      for (const expectedValue of testValues) {
        const decodedValue = codec.decode(buffer);
        expect(decodedValue).toBe(expectedValue);
      }
    });
  });

  describe('Big-Endian Byte Order', () => {
    it('should maintain big-endian byte order (network byte order)', () => {
      const testValue = 0x1234;
      codec.encode(buffer, testValue);
      
      buffer.index = 0;
      
      // Check individual bytes (big-endian: most significant byte first)
      expect(buffer.readByte()).toBe(0x12); // Most significant byte first
      expect(buffer.readByte()).toBe(0x34); // Least significant byte last
    });

    it('should handle negative values in big-endian', () => {
      const testValue = -1; // 0xFFFF in two's complement
      codec.encode(buffer, testValue);
      
      buffer.index = 0;
      
      // Check individual bytes - should be -1 (0xFF signed)
      expect(buffer.readByte()).toBe(-1);
      expect(buffer.readByte()).toBe(-1);
    });
  });

  describe('Range Validation', () => {
    it('should handle values at 16-bit boundaries', () => {
      const testValues = [
        32767,   // Max positive
        -32768,  // Min negative
        0,       // Zero
        1,       // Small positive
        -1       // Small negative
      ];
      
      for (const testValue of testValues) {
        buffer.index = 0; // Reset for each test
        
        codec.encode(buffer, testValue);
        buffer.index = 0;
        const decoded = codec.decode(buffer);
        
        expect(decoded).toBe(testValue);
      }
    });
  });

  describe('Error Handling', () => {
    it('should throw error when reading beyond buffer', () => {
      // Don't write anything, just try to read
      expect(() => {
        codec.decode(buffer);
      }).toThrow();
    });
  });

  describe('Integration with Other Codecs', () => {
    it('should work correctly when mixed with other data types', () => {
      // Write: int, short, short, int
      buffer.writeInt(123456);
      codec.encode(buffer, 789);
      codec.encode(buffer, -456);
      buffer.writeInt(987654);
      
      // Read back in same order
      buffer.index = 0;
      expect(buffer.readInt()).toBe(123456);
      expect(codec.decode(buffer)).toBe(789);
      expect(codec.decode(buffer)).toBe(-456);
      expect(buffer.readInt()).toBe(987654);
    });
  });
});
