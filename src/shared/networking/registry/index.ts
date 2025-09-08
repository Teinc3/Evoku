import type { PacketConstructor } from "../../types/networking/IPacket";
import type ActionEnum from "../../types/enums/actions";


/**
 * A singleton registry for networking packets.
 *
 * Packets, once registered by the createPacket factory, will automatically be added.
 * This allows for easy retrieval of packet classes based on their ActionEnum.
 */
class PacketRegistry {
  private registry = new Map<ActionEnum, PacketConstructor<ActionEnum>>();

  registerPacket(packetClass: PacketConstructor<ActionEnum>): void {
    // Create a temporary instance to access instance properties id
    const tempPacket = new packetClass();
    this.registry.set(tempPacket.id, packetClass);
  }

  getPacket(id: ActionEnum) {
    return this.registry.get(id);
  }
}

const packetRegistry = new PacketRegistry();
export { packetRegistry as default, PacketRegistry };