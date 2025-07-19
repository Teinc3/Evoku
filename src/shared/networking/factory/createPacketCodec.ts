import CustomCodec from "../codecs/CustomCodec";
import ActionCodec from "../codecs/custom/ActionCodec";

import type IDataContract from "../../types/contracts/IDataContract";
import type { CodecConstructor, CustomCodecMap } from "../../types/networking/ICodec";


// TODO: Consider typing using AugmentAction type so that the action field is defined
/**
 * Factory function to create packet codec classes with minimal boilerplate
 */
export default function createPacketCodec<GenericContract extends IDataContract>(
    codecMap: CustomCodecMap<GenericContract>
) {
    return class extends CustomCodec<GenericContract> {
        readonly codecMap = {
            action: ActionCodec,
            ...codecMap
        } as CustomCodecMap<GenericContract>;
    } as CodecConstructor<GenericContract>;
}