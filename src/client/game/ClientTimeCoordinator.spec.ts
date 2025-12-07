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
    timeCoordinator.updateSync(120, 30); // 120ms offset, 30ms RTT
    
    expect(timeCoordinator['rtt']).toBe(30);
    expect(timeCoordinator.estimateServerTime(1000)).toBe(895); // clientTime - offset + half RTT
  });

  it('should return client time as fallback when not synced', () => {
    expect(timeCoordinator.estimateServerTime(1000)).toBe(1000);
  });

  it('should get current server time', () => {
    timeCoordinator.updateSync(50, 20);
    
    // Mock performance.now to return 1100
    const originalNow = performance.now;
    performance.now = jasmine.createSpy('now').and.returnValue(1100);

    expect(timeCoordinator.serverTime).toBe(1060); // 1100 - 50 + 10 (half RTT)

    performance.now = originalNow;
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
