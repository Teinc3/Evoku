import AbstractPacket from "../AbstractPacket";
import PacketRegistry from "../../registry/PacketRegistry";
import createPacketCodec from "../../codecs/factory/createPacketCodec";

import type AugmentAction from "../../../types/utils/AugmentAction";
import type IPacket from "../../../types/networking/IPacket";
import type { PacketConstructor } from "../../../types/networking/IPacket";
import type { CustomCodecConstructor, CustomCodecMap } from "../../../types/networking/ICodec";
import type ActionEnum from "../../../types/enums/actions";
import type ActionMap from "../../../types/actionmap";


/**
 * Factory function to create complete packet classes that satisfy TypeScript's requirements.
 * This is the recommended approach for creating packets as it properly implements
 * all abstract properties and provides full type safety.
 * 
 * @param action - The action type for the packet, which is used to identify it.
 * @param codecMap - A map of keys in the contract and their respective codec classes.
 * Note: The order of keys provided in the codecMap influences the order of data in the packet.
 */
export default function createPacket<GenericAction extends ActionEnum>(
  action: GenericAction,
  codecMap: CustomCodecMap<ActionMap[GenericAction]>,
) {

  return class GenericPacket extends AbstractPacket<GenericAction>
    implements IPacket<GenericAction> {
    readonly id = action;
    readonly Codec = (
      createPacketCodec(codecMap) as CustomCodecConstructor<AugmentAction<GenericAction>>
    );

    static {
      // Register the packet class in the PacketRegistry upon creation of packet
      PacketRegistry.registerPacket(GenericPacket as unknown as PacketConstructor<ActionEnum>);
    }
  } as PacketConstructor<GenericAction>;
}