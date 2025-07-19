import AbstractPacket from "../packets/AbstractPacket";
import createPacketCodec from "./createPacketCodec";
import PacketRegistry from "../registry/PacketRegistry";

import type IPacket from "../../types/networking/IPacket";
import type { CodecConstructor, CustomCodecMap } from "../../types/networking/ICodec";
import type { PacketConstructor } from "../../types/networking/IPacket";
import type ActionEnum from "../../types/enums/actions";
import type ActionMap from "../../types/actionmap";


/**
 * Factory function to create complete packet classes that satisfy TypeScript's requirements.
 * This is the recommended approach for creating packets as it properly implements
 * all abstract properties and provides full type safety.
 * 
 * @param action - The action type for the packet, which is used to identify it.
 * @param codecLike - A codec-like map or constructor
 */
export default function createPacket<GenericAction extends ActionEnum>(
    action: GenericAction,
    codecLike: CustomCodecMap<ActionMap[GenericAction]> | CodecConstructor<ActionMap[GenericAction]>,
) {

    return class PacketClass extends AbstractPacket<GenericAction> implements IPacket<GenericAction> {
        readonly id = action;
        readonly Codec = codecLike instanceof Function ? codecLike : createPacketCodec<ActionMap[GenericAction]>(codecLike);

        static {
            // Register the packet class in the PacketRegistry upon creation of packet
            PacketRegistry.registerPacket(PacketClass as unknown as PacketConstructor<ActionEnum>);
        }
    } as PacketConstructor<GenericAction>;
}