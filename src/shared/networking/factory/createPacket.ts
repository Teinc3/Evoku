import AbstractPacket from "@shared/networking/packets/AbstractPacket";
import createPacketCodec from "@shared/networking/factory/createPacketCodec";
import PacketRegistry from "@shared/networking/registry/PacketRegistry";

import type IPacket from "@shared/types/networking/IPacket";
import type IDataContract from "@shared/types/contracts/IDataContract";
import type { CodecMap } from "@shared/types/networking/ICodec";
import type { OmitAction } from "@shared/types/contracts/IDataContract";
import type { PacketConstructor } from "@shared/types/networking/IPacket";


/**
 * Factory function to create complete packet classes that satisfy TypeScript's requirements.
 * This is the recommended approach for creating packets as it properly implements
 * all abstract properties and provides full type safety.
 */
export default function createPacket<GenericContract extends IDataContract>(
    action: GenericContract['action'],
    codecMap: OmitAction<CodecMap<GenericContract>>
) {
    return class PacketClass extends AbstractPacket<GenericContract> implements IPacket<GenericContract> {
        readonly id = action;
        readonly Codec = createPacketCodec(codecMap);

        static {
            // Register the packet class in the PacketRegistry
            PacketRegistry.registerPacket(PacketClass as PacketConstructor);
        }
    }
}