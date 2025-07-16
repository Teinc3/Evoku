import IntCodec from "@shared/networking/codecs/primitive/IntCodec";
import CustomCodec from "@shared/networking/codecs/CustomCodec";

import type IDataContract from "@shared/types/contracts/base/IDataContract";
import type { CodecConstructor, CodecMap } from "@shared/types/networking/ICodec";


/**
 * Factory function to create packet codec classes with minimal boilerplate
 */
export default function createPacketCodec<GenericContract extends IDataContract>(
    codecMap: CodecMap<GenericContract>
) {
    return class extends CustomCodec<GenericContract> {
        readonly codecMap = {
            action: IntCodec,
            ...codecMap
        } as CodecMap<GenericContract>;
    } as CodecConstructor<GenericContract>;
}