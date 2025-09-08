import PacketRegistry from "./index";
import PacketLoader from "./PacketLoader";
import SessionActions from "../../types/enums/actions/system/session";
import MechanicsActions from "../../types/enums/actions/match/player/mechanics";
import LifecycleActions from "../../types/enums/actions/match/lifecycle";

describe('PacketRegistry - Auto Registration', () => {
  beforeAll(async () => {
    // Clear the registry once at the start
    PacketRegistry.reset();
    PacketLoader.reset();
  });

  it('should automatically register packets when initialized', async () => {
    // Initialize packet loading
    await PacketRegistry.initialize();
    
    // Now packets should be available
    expect(PacketRegistry.getRegisteredCount()).toBeGreaterThan(0);
    expect(PacketRegistry.getPacket(SessionActions.HEARTBEAT)).toBeDefined();
    expect(PacketRegistry.getPacket(MechanicsActions.SET_CELL)).toBeDefined();
    expect(PacketRegistry.getPacket(MechanicsActions.CELL_SET)).toBeDefined();
    expect(PacketRegistry.getPacket(LifecycleActions.GAME_INIT)).toBeDefined();
    expect(PacketRegistry.getPacket(LifecycleActions.GAME_OVER)).toBeDefined();
  });

  it('should handle multiple initialization calls safely', async () => {
    // Call initialize multiple times (packets should already be loaded from previous test)
    await Promise.all([
      PacketRegistry.initialize(),
      PacketRegistry.initialize(),
      PacketRegistry.initialize()
    ]);
    
    // Should still work correctly
    expect(PacketRegistry.getRegisteredCount()).toBeGreaterThan(0);
    expect(PacketRegistry.getPacket(SessionActions.HEARTBEAT)).toBeDefined();
  });

  it('should load specific packet types correctly', async () => {
    await PacketRegistry.initialize();
    
    // Test various packet categories are loaded
    const testPackets = [
      // System packets
      SessionActions.HEARTBEAT,
      
      // Player mechanics
      MechanicsActions.SET_CELL,
      MechanicsActions.CELL_SET,
      
      // Lifecycle
      LifecycleActions.GAME_INIT,
      LifecycleActions.GAME_OVER
    ];
    
    testPackets.forEach(actionType => {
      const packet = PacketRegistry.getPacket(actionType);
      expect(packet).toBeDefined();
      expect(packet?.id).toBe(actionType);
    });
  });

  it('should demonstrate the fixed problem - packets registered without explicit imports', async () => {
    // After initialization, packets are available
    await PacketRegistry.initialize();
    expect(PacketRegistry.getPacket(SessionActions.HEARTBEAT)).toBeDefined();
  });
});