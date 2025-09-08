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
  private static autoLoadPromise: Promise<void> | null = null;
    
  static registerPacket(packetClass: PacketConstructor<ActionEnum>): void {
    this.registry.set(packetClass.id, packetClass);
  }

  static getPacket(id: ActionEnum) {
    return this.registry.get(id);
  }

  /**
   * Ensures all packets are loaded before retrieving a packet.
   * This is the recommended method for getting packets to ensure
   * auto-registration has completed.
   */
  static async getPacketAsync(id: ActionEnum) {
    await this.ensurePacketsLoaded();
    return this.registry.get(id);
  }

  /**
   * Ensures all packets are loaded by triggering auto-loading if not already done.
   * This method is idempotent and safe to call multiple times.
   */
  static async ensurePacketsLoaded(): Promise<void> {
    if (this.autoLoadPromise) {
      return this.autoLoadPromise;
    }

    this.autoLoadPromise = this.loadAllPackets();
    return this.autoLoadPromise;
  }

  /**
   * Internal method to dynamically load all packet files.
   * This uses dynamic imports to ensure packet registration happens.
   */
  private static async loadAllPackets(): Promise<void> {
    try {
      const { loadAllPacketsViaGlob } = await import('./PacketAutoLoader');
      await loadAllPacketsViaGlob();
    } catch (error) {
      console.warn('Failed to auto-load packets:', error);
    }
  }

  /**
   * Gets the current number of registered packets.
   * Useful for debugging and testing.
   */
  static getRegisteredCount(): number {
    return this.registry.size;
  }

  /**
   * Gets all registered packet IDs.
   * Useful for debugging and testing.
   */
  static getRegisteredIds(): ActionEnum[] {
    return Array.from(this.registry.keys());
  }
}