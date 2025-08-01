import PacketBuffer from '../../utils/PacketBuffer';
import FloatCodec from './FloatCodec';

import type IPacketBuffer from '../../../types/networking/IPacketBuffer';


describe('FloatCodec', () => {
  let codec: FloatCodec;
  let buffer: IPacketBuffer;

  beforeEach(() => {
    codec = new FloatCodec();
    buffer = new PacketBuffer();
  });

  describe('Encode/Decode', () => {
    it('should encode and decode positive floats', () => {
      const testValue = 3.14159;
      const bytesWritten = codec.encode(buffer, testValue);
      
      expect(bytesWritten).toBe(4);
      expect(buffer.index).toBe(4);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBeCloseTo(testValue, 6);
    });

    it('should encode and decode negative floats', () => {
      const testValue = -123.456;
      const bytesWritten = codec.encode(buffer, testValue);
      
      expect(bytesWritten).toBe(4);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBeCloseTo(testValue, 5);
    });

    it('should handle zero correctly', () => {
      const testValue = 0.0;
      codec.encode(buffer, testValue);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(testValue);
    });

    it('should handle integer values as floats', () => {
      const testValue = 42;
      codec.encode(buffer, testValue);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(42.0);
    });

    it('should handle very small decimal values', () => {
      const testValue = 0.000001;
      codec.encode(buffer, testValue);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBeCloseTo(testValue, 6);
    });

    it('should handle very large values', () => {
      const testValue = 999999.999;
      codec.encode(buffer, testValue);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBeCloseTo(testValue, 2);
    });
  });

  describe('IEEE 754 Float32 Limits', () => {
    it('should handle maximum finite float32 value', () => {
      const maxFloat32 = 3.4028235e+38;
      codec.encode(buffer, maxFloat32);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBeCloseTo(maxFloat32, -31);
    });

    it('should handle minimum positive float32 value', () => {
      const minFloat32 = 1.175494e-38;
      codec.encode(buffer, minFloat32);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBeCloseTo(minFloat32, 44);
    });

    it('should handle Infinity', () => {
      const testValue = Infinity;
      codec.encode(buffer, testValue);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(Infinity);
    });

    it('should handle negative Infinity', () => {
      const testValue = -Infinity;
      codec.encode(buffer, testValue);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(-Infinity);
    });

    it('should handle NaN', () => {
      const testValue = NaN;
      codec.encode(buffer, testValue);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBeNaN();
    });
  });

  describe('Precision Tests', () => {
    it('should maintain float32 precision limits', () => {
      // Float32 has about 7 decimal digits of precision
      const testValues = [
        1.234567, // Should be preserved
        1.2345678, // May lose precision
        123.4567, // Should be preserved
        0.1234567 // Should be preserved
      ];
      
      for (const testValue of testValues) {
        buffer.index = 0; // Reset for each test
        
        codec.encode(buffer, testValue);
        buffer.index = 0;
        const decoded = codec.decode(buffer);
        
        // Use appropriate precision for float32
        expect(decoded).toBeCloseTo(testValue, 4);
      }
    });
  });

  describe('Multiple Values', () => {
    it('should handle multiple floats in sequence', () => {
      const testValues = [1.1, -2.2, 3.3, -4.4, 0.0, 999.999];
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
        expect(decodedValue).toBeCloseTo(expectedValue, 4);
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

  describe('Big-Endian Byte Order', () => {
    it('should maintain consistent big-endian byte order (network standard)', () => {
      const testValue = 1.0;
      codec.encode(buffer, testValue);
      
      // Get the raw bytes
      buffer.index = 0;
      const bytes = buffer.read(4);
      
      // Recreate float from bytes using DataView
      const view = new DataView(bytes.buffer);
      const reconstructed = view.getFloat32(0);
      
      expect(reconstructed).toBe(testValue);
    });
  });
});
