import CustomCodec from "../CustomCodec";

import type { CodecConstructor, CustomCodecMap } from "../../../types/networking/ICodec";
import type IDataContract from "../../../types/contracts/components/base/IDataContract";


/**
 * Factory function to create packet codec classes with minimal boilerplate
 */
export default function createPacketCodec<GenericContract extends IDataContract>(
  codecMap: CustomCodecMap<GenericContract>
) {
  return class CustomPacketCodec extends CustomCodec<GenericContract> {
    readonly codecMap = codecMap;
  } as CodecConstructor<GenericContract>;
}