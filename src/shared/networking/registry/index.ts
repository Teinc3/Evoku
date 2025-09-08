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
  private static autoInitialized = false;
  private static initPromise: Promise<void> | null = null;
    
  static registerPacket(packetClass: PacketConstructor<ActionEnum>): void {
    this.registry.set(packetClass.id, packetClass);
  }

  static getPacket(id: ActionEnum) {
    return this.registry.get(id);
  }

  /**
   * Initialize automatic packet loading if not already done.
   * This is called automatically by PacketIO but can be called manually.
   */
  static async initialize(): Promise<void> {
    if (this.autoInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.performInitialization();
    return this.initPromise;
  }

  private static async performInitialization(): Promise<void> {
    try {
      const { default: PacketLoader } = await import('./PacketLoader');
      
      // Try file system approach first (works in Node.js)
      try {
        await PacketLoader.loadAllPackets();
      } catch {
        // Fallback to known packets approach (works in bundled environments)
        await PacketLoader.loadKnownPackets();
      }
      
      this.autoInitialized = true;
    } catch (error) {
      console.warn('Failed to auto-initialize packet registry:', error);
      // Don't throw - allow manual imports as fallback
    }
  }

  /**
   * Get the number of registered packets
   */
  static getRegisteredCount(): number {
    return this.registry.size;
  }

  /**
   * Check if auto-initialization has been completed
   */
  static isInitialized(): boolean {
    return this.autoInitialized;
  }

  /**
   * Reset the registry (mainly for testing)
   */
  static reset(): void {
    this.registry.clear();
    this.autoInitialized = false;
    this.initPromise = null; // Clear the initialization promise
  }
}