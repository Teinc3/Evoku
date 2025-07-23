import PacketBuffer from '../../utils/PacketBuffer';
import ByteCodec from './ByteCodec';

import type IPacketBuffer from '../../../types/networking/IPacketBuffer';


describe('ByteCodec', () => {
  let codec: ByteCodec;
  let buffer: IPacketBuffer;

  beforeEach(() => {
    codec = new ByteCodec();
    buffer = new PacketBuffer();
  });

  describe('Encode/Decode', () => {
    it('should encode and decode positive bytes', () => {
      const testValue = 42;
      const bytesWritten = codec.encode(buffer, testValue);
      
      expect(bytesWritten).toBe(1);
      expect(buffer.index).toBe(1);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(testValue);
      expect(buffer.index).toBe(1);
    });

    it('should encode and decode negative bytes', () => {
      const testValue = -100;
      const bytesWritten = codec.encode(buffer, testValue);
      
      expect(bytesWritten).toBe(1);
      
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

    it('should handle maximum 8-bit signed byte', () => {
      const maxByte = 127;
      codec.encode(buffer, maxByte);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(maxByte);
    });

    it('should handle minimum 8-bit signed byte', () => {
      const minByte = -128;
      codec.encode(buffer, minByte);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(minByte);
    });

    it('should handle multiple bytes in sequence', () => {
      const testValues = [1, -1, 127, -128, 0, 50, -75];
      let totalBytes = 0;
      
      // Encode all values
      for (const value of testValues) {
        totalBytes += codec.encode(buffer, value);
      }
      
      expect(totalBytes).toBe(testValues.length);
      
      // Decode all values
      buffer.index = 0;
      for (const expectedValue of testValues) {
        const decodedValue = codec.decode(buffer);
        expect(decodedValue).toBe(expectedValue);
      }
    });
  });

  describe('Byte Range Validation', () => {
    it('should handle all valid signed byte values', () => {
      const testValues = [
        127,   // Max positive
        -128,  // Min negative
        0,     // Zero
        1,     // Small positive
        -1     // Small negative
      ];
      
      for (const testValue of testValues) {
        buffer.index = 0; // Reset for each test
        
        codec.encode(buffer, testValue);
        buffer.index = 0;
        const decoded = codec.decode(buffer);
        
        expect(decoded).toBe(testValue);
      }
    });

    it('should preserve byte values across full range', () => {
      // Test a broader range of values
      for (let i = -128; i <= 127; i += 17) { // Sample every 17th value
        buffer.index = 0;
        
        codec.encode(buffer, i);
        buffer.index = 0;
        const decoded = codec.decode(buffer);
        
        expect(decoded).toBe(i);
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

  describe('Two\'s Complement Representation', () => {
    it('should handle two\'s complement for negative values', () => {
      const testValue = -1; // Should be 0xFF in two's complement
      codec.encode(buffer, testValue);
      
      buffer.index = 0;
      
      // Read as unsigned to check binary representation
      const rawBytes = buffer.read(1);
      expect(rawBytes[0]).toBe(0xFF);
      
      // Verify it decodes back correctly
      buffer.index = 0;
      expect(codec.decode(buffer)).toBe(-1);
    });
  });

  describe('Out-of-Range Values', () => {
    it('should wrap values greater than 127', () => {
      const outOfRangeValue = 128; // One greater than the max
      const expectedValue = -128; // This is what it will wrap around to

      codec.encode(buffer, outOfRangeValue);
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);

      expect(decodedValue).not.toBe(outOfRangeValue);
      expect(decodedValue).toBe(expectedValue);
    });

    it('should wrap values less than -128', () => {
      const outOfRangeValue = -129; // One less than the min
      const expectedValue = 127; // This is what it will wrap around to

      codec.encode(buffer, outOfRangeValue);
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);

      expect(decodedValue).not.toBe(outOfRangeValue);
      expect(decodedValue).toBe(expectedValue);
    });

    it('should wrap values full round', () => {
      const outOfRangeValue = 256; // Two full cycles of 0-255
      const expectedValue = 0; // Should wrap around to zero

      codec.encode(buffer, outOfRangeValue);
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);

      expect(decodedValue).not.toBe(outOfRangeValue);
      expect(decodedValue).toBe(expectedValue);
    });
  });

});
