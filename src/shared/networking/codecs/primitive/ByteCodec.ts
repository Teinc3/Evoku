import AbstractCodec from "../AbstractCodec";

import type IPacketBuffer from "../../../types/networking/IPacketBuffer";


/**
 * Integer codec for encoding and decoding 1-byte integers (signed by default).
 * 
 * @extends AbstractCodec<number>
 */
export default class ByteCodec extends AbstractCodec<number> {
    
  encode(buffer: IPacketBuffer, data: number): number {
    return buffer.writeByte(data);
  }

  decode(buffer: IPacketBuffer): number {
    return buffer.readByte();
  }
}
