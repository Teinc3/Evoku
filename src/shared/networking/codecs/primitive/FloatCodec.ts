import AbstractCodec from "../AbstractCodec";

import type IPacketBuffer from "../../../types/networking/IPacketBuffer";


/**
 * Integer codec for encoding and decoding 4-byte Float values.
 * 
 * Follows the IEEE 754 standard for 32-bit floating point representation.
 * 
 * @extends AbstractCodec<number>
 */
export default class FloatCodec extends AbstractCodec<number> {
    
  encode(buffer: IPacketBuffer, data: number): number {
    return buffer.writeFloat(data);
  }

  decode(buffer: IPacketBuffer): number {
    return buffer.readFloat();
  }
}