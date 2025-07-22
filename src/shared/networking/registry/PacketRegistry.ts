import type { PacketConstructor } from "../../types/networking/IPacket";
import type ActionEnum from "../../types/enums/actions";


/**
 * A singleton registry for networking packets.
 * 
 * Packets, once registered by the createPacket factory,
 * will automatically be added to this registry.
 * This allows for easy retrieval of packet classes
 * based on their ActionEnum.
 */
export default class PacketRegistry {
  private static registry = new Map<ActionEnum, PacketConstructor<ActionEnum>>();
    
  static registerPacket(packetClass: PacketConstructor<ActionEnum>): void {
    this.registry.set(packetClass.id, packetClass);
  }

  static getPacket(id: ActionEnum) {
    return this.registry.get(id);
  }
}