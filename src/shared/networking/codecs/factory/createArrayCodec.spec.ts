import createArrayCodec from './createArrayCodec';
import { ByteCodec, IntCodec, StringCodec } from '../primitive';
import PlayerInfoCodec from '../custom/PlayerInfoCodec';
import PacketBuffer from '../../../utils/PacketBuffer';

import type IPacketBuffer from '../../../types/utils/IPacketBuffer';
import type PlayerInfoContract from '../../../types/contracts/lifecycle/PlayerInfoContract';


describe('createArrayCodec Factory', () => {
  let buffer: IPacketBuffer;

  beforeEach(() => {
    buffer = new PacketBuffer();
  });

  // Test Case 1: Array of Primitive Types
  it('should correctly encode and decode an array of primitive types', () => {
    const IntArrayCodec = createArrayCodec(IntCodec);
    const codec = new IntArrayCodec();
    const data = [100, 200, -300, 400, 500];

    codec.encode(buffer, data);
    buffer.index = 0;
    const decodedData = codec.decode(buffer);

    expect(decodedData).toEqual(data);
  });

  // Test Case 2: Array of Complex Custom Types
  // This is the case you mentioned you already have, included here for completeness.
  it('should correctly encode and decode an array of custom codec types', () => {
    const ArrayOfPlayerInfoCodec = createArrayCodec(PlayerInfoCodec);
    const codec = new ArrayOfPlayerInfoCodec();
    const data: PlayerInfoContract[] = [
      { playerID: 1, username: 'PlayerOne' },
      { playerID: 2, username: 'PlayerTwo' },
    ];

    codec.encode(buffer, data);
    buffer.index = 0;
    const decodedData = codec.decode(buffer);

    expect(decodedData).toEqual(data);
  });

  // Test Case 3: Empty Array (Edge Case)
  it('should correctly handle an empty array', () => {
    const ArrayOfByteCodec = createArrayCodec(ByteCodec);
    const codec = new ArrayOfByteCodec();
    const data: number[] = [];

    codec.encode(buffer, data);
    buffer.index = 0;
    const decodedData = codec.decode(buffer);

    expect(decodedData).toEqual([]);
    // The buffer should only contain the 4 bytes for the length (which is 0)
    expect(buffer.maxWritten).toBe(4);
  });

  // Test Case 4: Array with 10000 elements (Performance Test)
  it('should handle large arrays efficiently', () => {
    const LargeIntArrayCodec = createArrayCodec(IntCodec);
    const codec = new LargeIntArrayCodec();
    const data = Array.from({ length: 10000 }, (_, i) => i);

    codec.encode(buffer, data);
    buffer.index = 0;
    const decodedData = codec.decode(buffer);

    expect(decodedData).toEqual(data);
  });

  // Test Case 5: Array with mixed dtypes (should cause data mismatch)
  it('should result in mismatched data when decoding mixed types', () => {
    const MixedArrayCodec = createArrayCodec(StringCodec);
    const codec = new MixedArrayCodec();
    const data = ['one', 2, 'three']; // Mixed array

    // The encode will succeed, but the number 2 will be converted to the string "2"
    // @ts-expect-error 2345
    codec.encode(buffer, data);

    buffer.index = 0;
    const decodedData = codec.decode(buffer);

    // Assert that the decoded data does NOT equal the original data
    // @ts-expect-error 2345
    expect(decodedData).not.toEqual(data);

    // Assert what the data actually became (TextEncoder by js' goofy type coercion)
    expect(decodedData).toEqual(['one', '2', 'three']);
  });
});
