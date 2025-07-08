import AbstractCodec from "../AbstractCodec";

import type IPacketBuffer from "@shared/types/utils/IPacketBuffer";


/**
 * Integer codec for encoding and decoding 2-byte integers (signed by default).
 * 
 * @extends AbstractCodec<number>
 */
export default class ShortCodec extends AbstractCodec<number> {
    
    encode(buffer: IPacketBuffer, data: number): number {
        return buffer.writeShort(data);
    }

    decode(buffer: IPacketBuffer): number {
        return buffer.readShort();
    }
}