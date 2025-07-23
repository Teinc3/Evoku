import PacketBuffer from './PacketBuffer';

import type IPacketBuffer from '../../types/networking/IPacketBuffer';


describe('PacketBuffer', () => {
  let buffer: IPacketBuffer;

  // Create a new, clean buffer before each test
  beforeEach(() => {
    buffer = new PacketBuffer();
  });

  // Test Suite for Write/Read Operations
  describe('Write/Read Operations', () => {
    it('should write and read a boolean value', () => {
      buffer.writeBool(true);
      buffer.writeBool(false);
      buffer.index = 0; // Reset index to read from the start
      expect(buffer.readBool()).toBe(true);
      expect(buffer.readBool()).toBe(false);
    });

    it('should write and read a signed 8-bit integer (byte)', () => {
      const value = -128;
      buffer.writeByte(value);
      buffer.index = 0;
      expect(buffer.readByte()).toBe(value);
    });

    it('should write and read a signed 16-bit integer (short)', () => {
      const value = -32768;
      buffer.writeShort(value);
      buffer.index = 0;
      expect(buffer.readShort()).toBe(value);
    });

    it('should write and read a signed 32-bit integer (int)', () => {
      const value = 123456789;
      buffer.writeInt(value);
      buffer.index = 0;
      expect(buffer.readInt()).toBe(value);
    });

    it('should write and read a 32-bit float', () => {
      const value = Math.PI;
      buffer.writeFloat(value);
      buffer.index = 0;
      // Use toBeCloseTo for floating-point comparisons
      expect(buffer.readFloat()).toBeCloseTo(value);
    });

    it('should write and read a raw byte array', () => {
      const data = new Uint8Array([1, 2, 3, 4, 5]);
      buffer.write(data);
      buffer.index = 0;
      const readData = buffer.read(5);
      expect(readData).toEqual(data);
    });

    it('should write and read a string with a length prefix', () => {
      const message = "Hello, World!";
      buffer.writeString(message);
      buffer.index = 0;
      expect(buffer.readString()).toBe(message);
    });

    it('should handle multiple sequential writes and reads correctly', () => {
      const testData = {
        id: 101,
        isActive: true,
        name: "Test"
      };
      buffer.writeByte(testData.id);
      buffer.writeBool(testData.isActive);
      buffer.writeString(testData.name);

      buffer.index = 0;

      expect(buffer.readByte()).toBe(testData.id);
      expect(buffer.readBool()).toBe(testData.isActive);
      expect(buffer.readString()).toBe(testData.name);
    });
  });

  // Test Suite for Buffer Management and State
  describe('Buffer Management', () => {
    it('should correctly track the maxWritten index', () => {
      buffer.writeInt(123);
      expect(buffer.maxWritten).toBe(4);
      buffer.writeShort(456);
      expect(buffer.maxWritten).toBe(6);
    });

    it('should write correctly at a specified offset', () => {
      buffer.writeInt(1111, 0); // Write at the start
      buffer.writeInt(2222, 4); // Write after the first int

      // Write a short at an offset that overlaps existing data
      buffer.writeShort(99, 1);

      buffer.index = 0;
      // Read the original int, which should now be corrupted by the short
      const value = buffer.readInt();
      expect(value).not.toBe(1111);

      // Check that maxWritten was updated correctly
      expect(buffer.maxWritten).toBe(8);
    });

    it('should clone the buffer with its exact state', () => {
      buffer.writeInt(123);
      buffer.writeString("clone test");
      buffer.index = 4; // Move the read index partway through

      const clone = buffer.clone();

      // Check that the content is identical
      expect(clone.buffer.slice(0, clone.maxWritten))
        .toEqual(buffer.buffer.slice(0, buffer.maxWritten));
            
      // Check that the state properties are identical
      expect(clone.index).toBe(buffer.index);
      expect(clone.maxWritten).toBe(buffer.maxWritten);

      // Reading from the clone should yield the same result
      expect(clone.readString()).toBe("clone test");
    });

    it('should automatically double the buffer when writing beyond capacity', () => {
      expect(buffer.buffer.byteLength).toBe(256); // Default initial size

      // Write a string that Does not exceed initial capacity - 9 bytes written
      buffer.writeString("Hello");
      expect(buffer.buffer.byteLength).toBe(256);

      // Write a string that reaches the initial capacity, but does not exceed it
      buffer.write(new Uint8Array(247).fill(0)) // 247 + 9 = total 256 bytes written
      expect(buffer.buffer.byteLength).toBe(256);

      // Write a string that exceeds the initial capacity
      let str = 'a'.repeat(100); // Should trigger resize from 256 -> 512
      buffer.writeString(str);
      expect(buffer.buffer.byteLength).toBe(512);

      // Write a string that exceeds multiple capacities at once
      str = 'b'.repeat(10000); // Should trigger resize to 16384 bytes
      buffer.writeString(str);
      expect(buffer.buffer.byteLength).toBe(16384);
    });
        
    it('should throw when writing a string that exceeds maxByteLength', () => {
      // maxByteLength is 2**16 - 1 = 65535
      const tooLong = 'x'.repeat(70000); // Exceeds maxByteLength
      expect(() => buffer.writeString(tooLong)).toThrow();
    });
  });

  // Test Suite for Edge Cases and Error Handling
  describe('Edge Cases and Error Handling', () => {
    it('should throw a RangeError when trying to read beyond maxWritten', () => {
      buffer.writeInt(123); // maxWritten is now 4
      buffer.index = 0;
      buffer.readByte(); // index is now 1
      buffer.readByte(); // index is now 2
            
      // We have only written 4 bytes, so trying to read a full int from index 2 should fail
      expect(() => buffer.readInt()).toThrow(RangeError);
    });

    it('should not throw when reading up to the exact maxWritten boundary', () => {
      buffer.writeInt(123);
      buffer.index = 0;
      // This should work without throwing an error
      expect(() => buffer.readInt()).not.toThrow();
    });

    it('should throw a RangeError when setting an out-of-bounds index', () => {
      expect(() => { buffer.index = -1; }).toThrow(RangeError);
      expect(() => { buffer.index = buffer.buffer.byteLength; }).toThrow(RangeError);
    });
  });
});