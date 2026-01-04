import ClientTimeCoordinator from './ClientTimeCoordinator';

import type { PingContract } from '@shared/types/contracts';


describe('ClientTimeCoordinator', () => {
  let timeCoordinator: ClientTimeCoordinator;

  beforeEach(() => {
    timeCoordinator = new ClientTimeCoordinator();
  });

  it('should handle ping packet and return pong response', () => {
    const ping: PingContract = {
      serverTime: 1000,
      clientPing: 950
    };
    
    const pong = timeCoordinator.handlePing(ping);
    
    expect(pong).toEqual({
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
});
