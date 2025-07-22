import PacketBuffer from '../../../utils/PacketBuffer';
import IntCodec from './IntCodec';

import type IPacketBuffer from '../../../types/utils/IPacketBuffer';


describe('IntCodec', () => {
  let codec: IntCodec;
  let buffer: IPacketBuffer;

  beforeEach(() => {
    codec = new IntCodec();
    buffer = new PacketBuffer();
  });

  describe('Encode/Decode', () => {
    it('should encode and decode positive integers', () => {
      const testValue = 42;
      const bytesWritten = codec.encode(buffer, testValue);
      
      expect(bytesWritten).toBe(4);
      expect(buffer.index).toBe(4);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(testValue);
      expect(buffer.index).toBe(4);
    });

    it('should encode and decode negative integers', () => {
      const testValue = -12345;
      const bytesWritten = codec.encode(buffer, testValue);
      
      expect(bytesWritten).toBe(4);
      
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

    it('should handle maximum 32-bit signed integer', () => {
      const maxInt = 2147483647;
      codec.encode(buffer, maxInt);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(maxInt);
    });

    it('should handle minimum 32-bit signed integer', () => {
      const minInt = -2147483648;
      codec.encode(buffer, minInt);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(minInt);
    });

    it('should handle multiple integers in sequence', () => {
      const testValues = [1, -1, 100, -100, 999999, -999999];
      let totalBytes = 0;
      
      // Encode all values
      for (const value of testValues) {
        totalBytes += codec.encode(buffer, value);
      }
      
      expect(totalBytes).toBe(testValues.length * 4);
      
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
      const testValue = 0x12345678;
      codec.encode(buffer, testValue);
      
      buffer.index = 0;
      
      // Check individual bytes (big-endian: most significant byte first)
      expect(buffer.readByte()).toBe(0x12); // Most significant byte first
      expect(buffer.readByte()).toBe(0x34);
      expect(buffer.readByte()).toBe(0x56);
      expect(buffer.readByte()).toBe(0x78); // Least significant byte last
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
});
