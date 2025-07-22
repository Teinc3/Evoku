import PacketBuffer from '../../../utils/PacketBuffer';
import BoolCodec from './BoolCodec';

import type IPacketBuffer from '../../../types/utils/IPacketBuffer';


describe('BoolCodec', () => {
  let codec: BoolCodec;
  let buffer: IPacketBuffer;

  beforeEach(() => {
    codec = new BoolCodec();
    buffer = new PacketBuffer();
  });

  describe('Encode/Decode', () => {
    it('should encode and decode true values', () => {
      const testValue = true;
      const bytesWritten = codec.encode(buffer, testValue);
      
      expect(bytesWritten).toBe(1);
      expect(buffer.index).toBe(1);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(testValue);
      expect(buffer.index).toBe(1);
    });

    it('should encode and decode false values', () => {
      const testValue = false;
      const bytesWritten = codec.encode(buffer, testValue);
      
      expect(bytesWritten).toBe(1);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(testValue);
    });

    it('should handle multiple boolean values in sequence', () => {
      const testValues = [true, false, true, true, false, false];
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

  describe('Binary Representation', () => {
    it('should encode true as 1 byte', () => {
      codec.encode(buffer, true);
      
      buffer.index = 0;
      const byteValue = buffer.readByte();
      
      expect(byteValue).toBe(1);
    });

    it('should encode false as 0 byte', () => {
      codec.encode(buffer, false);
      
      buffer.index = 0;
      const byteValue = buffer.readByte();
      
      expect(byteValue).toBe(0);
    });

    it('should decode non-zero values as true', () => {
      // Manually write a non-zero, non-one value
      buffer.writeByte(42);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(true);
    });

    it('should decode zero as false', () => {
      // Manually write zero
      buffer.writeByte(0);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(false);
    });

    it('should decode negative values as true', () => {
      // Manually write a negative value
      buffer.writeByte(-1);
      
      buffer.index = 0;
      const decodedValue = codec.decode(buffer);
      
      expect(decodedValue).toBe(true);
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
      // Write: int, bool, bool, int
      buffer.writeInt(42);
      codec.encode(buffer, true);
      codec.encode(buffer, false);
      buffer.writeInt(99);
      
      // Read back in same order
      buffer.index = 0;
      expect(buffer.readInt()).toBe(42);
      expect(codec.decode(buffer)).toBe(true);
      expect(codec.decode(buffer)).toBe(false);
      expect(buffer.readInt()).toBe(99);
    });
  });
});
