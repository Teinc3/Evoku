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
    try {
      // Create a temporary instance to access instance properties id
      const tempPacket = new packetClass();
      this.registry.set(tempPacket.id, packetClass);
    } catch (error) {
      console.warn(`Failed to register packet:`, error);
      // Don't register packets that can't be instantiated
    }
  }

  getPacket(id: ActionEnum) {
    return this.registry.get(id);
  }

  // Test helper method to access registry size
  getRegistrySize(): number {
    return this.registry.size;
  }
}

const packetRegistry = new PacketRegistry();
export { packetRegistry as default, PacketRegistry };