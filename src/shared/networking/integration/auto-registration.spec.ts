import PacketRegistry from '../registry';
import LifecycleActions from '../../types/enums/actions/match/lifecycle';
import LobbyActions from '../../types/enums/actions/system/lobby';


describe('Packet Auto-Registration Integration', () => {
  beforeEach(async () => {
    // Ensure packets are loaded before each test
    await PacketRegistry.ensurePacketsLoaded();
  });

  it('should automatically load and register packets without explicit imports', async () => {
    // Without any explicit imports in this test file, we should still be able to 
    // get packets from the registry because they were auto-loaded

    const gameInitPacket = await PacketRegistry.getPacketAsync(LifecycleActions.GAME_INIT);
    expect(gameInitPacket).toBeDefined();
    expect(gameInitPacket?.id).toBe(LifecycleActions.GAME_INIT);

    const joinQueuePacket = await PacketRegistry.getPacketAsync(LobbyActions.JOIN_QUEUE);
    expect(joinQueuePacket).toBeDefined();
    expect(joinQueuePacket?.id).toBe(LobbyActions.JOIN_QUEUE);
  });

  it('should work with sync methods after auto-loading', async () => {
    // After auto-loading, sync methods should also work
    await PacketRegistry.ensurePacketsLoaded();

    const gameInitPacket = PacketRegistry.getPacket(LifecycleActions.GAME_INIT);
    expect(gameInitPacket).toBeDefined();
    expect(gameInitPacket?.id).toBe(LifecycleActions.GAME_INIT);
  });

  it('should have multiple packets registered', async () => {
    const registeredCount = PacketRegistry.getRegisteredCount();
    const registeredIds = PacketRegistry.getRegisteredIds();

    // Should have registered a significant number of packets
    expect(registeredCount).toBeGreaterThan(15);
    
    // Should include the packets we're testing
    expect(registeredIds).toContain(LifecycleActions.GAME_INIT);
    expect(registeredIds).toContain(LifecycleActions.GAME_OVER);
    expect(registeredIds).toContain(LobbyActions.JOIN_QUEUE);
    expect(registeredIds).toContain(LobbyActions.LEAVE_QUEUE);
    expect(registeredIds).toContain(LobbyActions.QUEUE_UPDATE);
  });

  it('should be idempotent when called multiple times', async () => {
    await PacketRegistry.ensurePacketsLoaded();
    const firstCount = PacketRegistry.getRegisteredCount();

    await PacketRegistry.ensurePacketsLoaded();
    const secondCount = PacketRegistry.getRegisteredCount();

    expect(firstCount).toBe(secondCount);
    expect(firstCount).toBeGreaterThan(0);
  });
});