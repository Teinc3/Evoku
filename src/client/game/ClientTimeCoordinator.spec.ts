import ClientTimeCoordinator from './ClientTimeCoordinator';

import type { PingContract } from '@shared/types/contracts';


describe('ClientTimeCoordinator', () => {
  let timeCoordinator: ClientTimeCoordinator;
  let mockSendPong: jasmine.Spy;

  beforeEach(() => {
    timeCoordinator = new ClientTimeCoordinator();
    mockSendPong = jasmine.createSpy('sendPong');
  });

  it('should handle ping packet and send pong response', () => {
    const ping: PingContract = {
      serverTime: 1000,
      clientPing: 950
    };
    
    timeCoordinator.handlePing(ping, mockSendPong);
    
    expect(mockSendPong).toHaveBeenCalled();
    const pongCall = mockSendPong.calls.first();
    expect(pongCall.args[0]).toEqual({
      clientTime: jasmine.any(Number),
      serverTime: 1000
    });
  });

  it('should update sync when server provides timing data', () => {
    // Scenario:
    // Client Time: 1000
    // Server Time (at Client 1000): 500
    // Latency: 50 (RTT 100)
    // Ping Server Time: 450 (sent 50ms ago)
    
    // Calculated Offset passed to updateSync:
    // 1000 - 450 - 50 = 500
    
    timeCoordinator.updateSync(500, 100);
    
    expect(timeCoordinator['rtt']).toBe(100);
    
    // Estimate Client Time for Server Time 500
    // Should be 500 + 500 = 1000
    expect(timeCoordinator.estimateClientTime(500)).toBe(1000);
  });

  it('should return server time as fallback when not synced', () => {
    expect(timeCoordinator.estimateClientTime(1000)).toBe(1000);
  });

  it('should reset synchronization state', () => {
    timeCoordinator.updateSync(50, 20);
    
    expect(timeCoordinator['rtt']).toBe(20);

    timeCoordinator.reset();

    expect(timeCoordinator['rtt']).toBe(0);
    // Not reset
    expect(timeCoordinator.clientTime).not.toBe(0);
  });

  it('should calculate time elapsed correctly', () => {
    // Default is 0
    expect(timeCoordinator.timeElapsed).toBe(0);

    // Initialize game
    timeCoordinator.onGameInit();
    
    // Should be close to 0 immediately
    expect(timeCoordinator.timeElapsed).toBeGreaterThanOrEqual(0);
    
    // Mock clientTime to simulate time passing
    spyOnProperty(timeCoordinator, 'clientTime', 'get')
      .and.returnValue(timeCoordinator['startTime']! + 1000);
    
    expect(timeCoordinator.timeElapsed).toBe(1000);
  });
});
