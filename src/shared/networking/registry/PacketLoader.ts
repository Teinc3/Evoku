/**
 * Automatically discovers and loads all packet definition files to ensure they are registered.
 * This loader handles both Node.js (server) and browser (client) environments.
 */
export default class PacketLoader {
  private static loaded = false;

  /**
   * Automatically load all packet definitions to register them in the PacketRegistry.
   * This method can be called multiple times safely - it will only load once.
   */
  static async loadAllPackets(): Promise<void> {
    if (this.loaded) {
      return;
    }

    try {
      // Use known packet list approach for reliability across all environments
      await this.loadKnownPackets();
      this.loaded = true;
    } catch (error) {
      console.warn('Failed to auto-load packets:', error);
      // Don't throw - allow manual imports to work as fallback
    }
  }

  /**
   * Load all known packet files using explicit import paths.
   * This approach works reliably in both Node.js and bundled environments.
   */
  static async loadKnownPackets(): Promise<void> {
    if (this.loaded) {
      return;
    }

    const knownPacketPaths = [
      // System packets
      '../packets/system/session/Heartbeat',
      '../packets/system/lobby/Queue',
      '../packets/system/lobby/MatchFound',
      
      // Match lifecycle packets
      '../packets/match/lifecycle/GameInit',
      '../packets/match/lifecycle/GameOver',
      
      // Match protocol packets
      '../packets/match/protocol/RejectAction',
      '../packets/match/protocol/PingPong',
      
      // Player mechanics
      '../packets/match/player/mechanics/DrawPup',
      '../packets/match/player/mechanics/SetCell',
      
      // Powerup packets - Fire
      '../packets/match/player/powerups/fire/Inferno',
      '../packets/match/player/powerups/fire/Metabolic',
      
      // Powerup packets - Water
      '../packets/match/player/powerups/water/Cryo',
      '../packets/match/player/powerups/water/Cascade',
      
      // Powerup packets - Earth
      '../packets/match/player/powerups/earth/Landslide',
      '../packets/match/player/powerups/earth/Excavate',
      
      // Powerup packets - Wood
      '../packets/match/player/powerups/wood/Entangle',
      '../packets/match/player/powerups/wood/Wisdom',
      
      // Powerup packets - Metal
      '../packets/match/player/powerups/metal/Lock',
      '../packets/match/player/powerups/metal/Forge'
    ];

    const importPromises = knownPacketPaths.map(packetPath => 
      import(packetPath).catch(error => {
        console.warn(`Failed to import known packet ${packetPath}:`, error);
      })
    );

    await Promise.all(importPromises);
    this.loaded = true;
  }

  /**
   * Check if packets have been loaded
   */
  static isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Reset the loaded state (mainly for testing)
   */
  static reset(): void {
    this.loaded = false;
  }
}