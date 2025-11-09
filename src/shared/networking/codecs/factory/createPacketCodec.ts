import CustomCodec from "../CustomCodec";
import ActionCodec from "../custom/ActionCodec";

import type AugmentAction from "../../../types/utils/AugmentAction";
import type {
  CustomCodecConstructor, CustomCodecMap 
} from "../../../types/networking/ICodec";
import type ActionEnum from "../../../types/enums/actions";
import type ActionMap from "../../../types/actionmap";


/**
 * Factory function to create packet codec classes with minimal boilerplate
 */
export default function createPacketCodec<GenericAction extends ActionEnum>(
  codecMap: CustomCodecMap<ActionMap[GenericAction]>,
) {
  return class CustomPacketCodec extends CustomCodec<AugmentAction<GenericAction>> {

    readonly codecMap = {
      action: ActionCodec,
      ...codecMap
    } as CustomCodecMap<AugmentAction<GenericAction>>;

  } as CustomCodecConstructor<AugmentAction<GenericAction>>;
}
