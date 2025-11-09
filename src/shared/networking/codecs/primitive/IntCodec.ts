import AbstractCodec from "../AbstractCodec";

import type IPacketBuffer from "../../../types/networking/IPacketBuffer";


/**
 * Integer codec for encoding and decoding 4-byte integers (signed by default).
 * 
 * @extends AbstractCodec<number>
 */
export default class IntCodec extends AbstractCodec<number> {
    
  encode(buffer: IPacketBuffer, data: number): number {
    return buffer.writeInt(data);
  }

  decode(buffer: IPacketBuffer): number {
    return buffer.readInt();
  }
}
