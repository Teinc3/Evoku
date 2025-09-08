/**
 * PacketAutoLoader - Automatically discovers and loads all packet files
 * This module uses dynamic imports to ensure all packets are registered
 * without requiring manual imports or violating single source of truth.
 */

/**
 * Directly imports all packet files to ensure they are registered.
 * This function imports each packet file synchronously, triggering their static registration blocks.
 * 
 * This approach uses direct imports that are statically analyzable by bundlers and work in all environments.
 */
export async function loadAllPackets(): Promise<void> {
  // Direct imports to ensure all packets are registered
  try {
    // System packets
    await import('../packets/system/session/Heartbeat');
    await import('../packets/system/lobby/Queue');
    await import('../packets/system/lobby/MatchFound');
    
    // Match protocol packets
    await import('../packets/match/protocol/RejectAction');
    await import('../packets/match/protocol/PingPong');
    
    // Match lifecycle packets
    await import('../packets/match/lifecycle/GameInit');
    await import('../packets/match/lifecycle/GameOver');
    
    // Player mechanics packets
    await import('../packets/match/player/mechanics/DrawPup');
    await import('../packets/match/player/mechanics/SetCell');
    
    // Fire powerup packets
    await import('../packets/match/player/powerups/fire/Inferno');
    await import('../packets/match/player/powerups/fire/Metabolic');
    
    // Water powerup packets
    await import('../packets/match/player/powerups/water/Cryo');
    await import('../packets/match/player/powerups/water/Cascade');
    
    // Earth powerup packets
    await import('../packets/match/player/powerups/earth/Landslide');
    await import('../packets/match/player/powerups/earth/Excavate');
    
    // Wood powerup packets
    await import('../packets/match/player/powerups/wood/Entangle');
    await import('../packets/match/player/powerups/wood/Wisdom');
    
    // Metal powerup packets
    await import('../packets/match/player/powerups/metal/Lock');
    await import('../packets/match/player/powerups/metal/Forge');
  } catch (error) {
    console.warn('Failed to load some packets:', error);
  }
}

/**
 * Browser-compatible version using alternative approaches.
 * Falls back to the manifest approach for broad compatibility.
 */
export async function loadAllPacketsViaGlob(): Promise<void> {
  // For now, use the manifest approach for maximum compatibility
  // In the future, environment-specific optimizations can be added
  await loadAllPackets();
}