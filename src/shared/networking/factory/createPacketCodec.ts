import IntCodec from "../codecs/primitive/IntCodec";
import CustomCodec from "../codecs/CustomCodec";

import type IDataContract from "../../types/contracts/IDataContract";
import type { CodecConstructor, CustomCodecMap } from "../../types/networking/ICodec";


/**
 * Factory function to create packet codec classes with minimal boilerplate
 */
export default function createPacketCodec<GenericContract extends IDataContract>(
    codecMap: CustomCodecMap<GenericContract>
) {
    return class extends CustomCodec<GenericContract> {
        readonly codecMap = {
            action: IntCodec,
            ...codecMap
        } as CustomCodecMap<GenericContract>;
    } as CodecConstructor<GenericContract>;
}