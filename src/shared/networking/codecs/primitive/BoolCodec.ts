import AbstractCodec from "../AbstractCodec";

import type IPacketBuffer from "../../../types/utils/IPacketBuffer";


/**
 * Integer codec for encoding and decoding booleans.
 * 
 * @extends AbstractCodec<number>
 */
export default class BoolCodec extends AbstractCodec<boolean> {
    
  encode(buffer: IPacketBuffer, data: boolean): number {
    return buffer.writeBool(data);
  }

  decode(buffer: IPacketBuffer): boolean {
    return buffer.readBool();
  }
}