import type ActionEnum from "@shared/types/enums/ActionEnum";
import type { PacketConstructor } from "@shared/types/networking/IPacket";


/**
 * A singleton registry for networking packets.
 * 
 * Packets, once registered by the createPacket factory,
 * will automatically be added to this registry.
 * This allows for easy retrieval of packet classes
 * based on their ActionEnum.
 */
export default class PacketRegistry {
    private static registry = new Map<ActionEnum, PacketConstructor>();
    
    static registerPacket(packetClass: PacketConstructor): void {
        this.registry.set(packetClass.prototype.id, packetClass);
    }

    static getPacket(id: ActionEnum): PacketConstructor | undefined {
        return this.registry.get(id);
    }
}
