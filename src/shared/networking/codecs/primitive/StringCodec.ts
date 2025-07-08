import AbstractCodec from "../AbstractCodec";

import type IPacketBuffer from "@shared/types/utils/IPacketBuffer";


/**
 * Codec for encoding and decoding UTF-8 encoded strings.
 * 
 * @extends AbstractCodec<number>
 */
export default class StringCodec extends AbstractCodec<string> {
    
    encode(buffer: IPacketBuffer, data: string): number {
        return buffer.writeString(data);
    }

    decode(buffer: IPacketBuffer): string {
        return buffer.readString();
    }
}