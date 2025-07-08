import AbstractCodec from "@shared/networking/codecs/AbstractCodec";

import type IPacketBuffer from "@shared/types/utils/IPacketBuffer";


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