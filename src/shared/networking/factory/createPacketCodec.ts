import IntCodec from "@shared/networking/codecs/primitive/IntCodec";
import CustomCodec from "@shared/networking/codecs/CustomCodec";

import type IDataContract from "@shared/types/contracts/IDataContract";
import type { CodecMap } from "@shared/types/networking/ICodec";
import type { OmitAction } from "@shared/types/contracts/IDataContract";


/**
 * Factory function to create packet codec classes with minimal boilerplate
 */
export default function createPacketCodec<GenericContract extends IDataContract>(
    codecMap: OmitAction<CodecMap<GenericContract>>
) {
    return class extends CustomCodec<GenericContract> {
        readonly codecMap = {
            action: IntCodec,
            ...codecMap
        } as CodecMap<GenericContract>;
    };
}