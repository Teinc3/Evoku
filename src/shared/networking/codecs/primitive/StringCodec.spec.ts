import PacketBuffer from '../../../utils/PacketBuffer';
import StringCodec from './StringCodec';

import type IPacketBuffer from '../../../types/utils/IPacketBuffer';


describe('StringCodec', () => {
  let codec: StringCodec;
  let buffer: IPacketBuffer;

  beforeEach(() => {
    codec = new StringCodec();
    buffer = new PacketBuffer();
  });

  describe('Encode/Decode', () => {
    it('should encode and decode simple ASCII strings', () => {
      const testString = 'Hello World';
      const bytesWritten = codec.encode(buffer, testString);
      
      // 4 bytes for length + string bytes
      expect(bytesWritten).toBe(4 + testString.length);
      
      buffer.index = 0;
      const decodedString = codec.decode(buffer);
      
      expect(decodedString).toBe(testString);
    });

    it('should encode and decode empty strings', () => {
      const testString = '';
      const bytesWritten = codec.encode(buffer, testString);
      
      expect(bytesWritten).toBe(4); // Just the length prefix
      
      buffer.index = 0;
      const decodedString = codec.decode(buffer);
      
      expect(decodedString).toBe(testString);
    });

    it('should encode and decode UTF-8 strings with special characters', () => {
      const testString = 'Hello 世界! 🎮';
      const bytesWritten = codec.encode(buffer, testString);
      
      // UTF-8 encoding may use more bytes than string length
      const expectedBytes = new TextEncoder().encode(testString).length;
      expect(bytesWritten).toBe(4 + expectedBytes);
      
      buffer.index = 0;
      const decodedString = codec.decode(buffer);
      
      expect(decodedString).toBe(testString);
    });

    it('should handle strings with line breaks and whitespace', () => {
      const testString = 'Line 1\nLine 2\r\nTab:\tSpaces:   End';
      const bytesWritten = codec.encode(buffer, testString);
      
      const expectedBytes = new TextEncoder().encode(testString).length;
      expect(bytesWritten).toBe(4 + expectedBytes);
      
      buffer.index = 0;
      const decodedString = codec.decode(buffer);
      
      expect(decodedString).toBe(testString);
    });

    it('should handle long strings', () => {
      const testString = 'A'.repeat(1000);
      const bytesWritten = codec.encode(buffer, testString);
      
      expect(bytesWritten).toBe(4 + 1000);
      
      buffer.index = 0;
      const decodedString = codec.decode(buffer);
      
      expect(decodedString).toBe(testString);
      expect(decodedString.length).toBe(1000);
    });

    it('should handle multiple strings in sequence', () => {
      const testStrings = ['First', 'Second', 'Third', ''];
      let totalBytes = 0;
      
      // Encode all strings
      for (const str of testStrings) {
        totalBytes += codec.encode(buffer, str);
      }
      
      // Decode all strings
      buffer.index = 0;
      for (const expectedString of testStrings) {
        const decodedString = codec.decode(buffer);
        expect(decodedString).toBe(expectedString);
      }
      
      expect(buffer.index).toBe(totalBytes);
    });
  });

  describe('UTF-8 Encoding', () => {
    it('should correctly handle emoji and unicode characters', () => {
      const testStrings = [
        '🎮🎯🚀',
        '안녕하세요',
        'العربية',
        'Ελληνικά',
        '日本語'
      ];
      
      for (const testString of testStrings) {
        buffer.index = 0; // Reset buffer for each test
        
        codec.encode(buffer, testString);
        buffer.index = 0;
        const decoded = codec.decode(buffer);
        
        expect(decoded).toBe(testString);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle strings with null characters', () => {
      const testString = 'Hello\x00World';
      codec.encode(buffer, testString);
      
      buffer.index = 0;
      const decoded = codec.decode(buffer);
      
      expect(decoded).toBe(testString);
    });

    it('should throw error when reading beyond buffer', () => {
      // Write a string length but no actual string data
      buffer.writeInt(100); // Claim string is 100 bytes
      buffer.index = 0;
      
      expect(() => {
        codec.decode(buffer);
      }).toThrow();
    });
  });

  describe('Length Prefix Validation', () => {
    it('should correctly encode string length as 4-byte integer', () => {
      const testString = 'Test';
      codec.encode(buffer, testString);
      
      buffer.index = 0;
      const length = buffer.readInt();
      
      expect(length).toBe(4);
      
      // Read the actual string bytes
      const stringBytes = buffer.read(length);
      const decodedString = new TextDecoder().decode(stringBytes);
      
      expect(decodedString).toBe(testString);
    });
  });
});
