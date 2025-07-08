import AbstractCodec from "@shared/networking/codecs/AbstractCodec";

import type IPacketBuffer from "@shared/types/utils/IPacketBuffer";


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