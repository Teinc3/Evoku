import AbstractCodec from "../AbstractCodec";

import type IPacketBuffer from "@shared/types/utils/IPacketBuffer";


/**
 * Integer codec for encoding and decoding 4-byte integers (signed by default).
 * 
 * @extends AbstractCodec<number>
 */
export default class IntCodec extends AbstractCodec<number> {
    
    encode(buffer: IPacketBuffer, data: number): number {
        buffer.writeInt(data ?? 0); // true for little-endian
        return 4; // 4 bytes for a 32-bit integer
    }

    decode(buffer: IPacketBuffer): number {
        return buffer.readInt(); // true for little-endian
    }
}