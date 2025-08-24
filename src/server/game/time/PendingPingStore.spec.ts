import PendingPingStore from './PendingPingStore';


describe('PendingPingStore', () => {
  let store: PendingPingStore;
  const playerID = 1;

  beforeEach(() => {
    store = new PendingPingStore();
  });

  describe('addPendingPing', () => {
    it('should add a pending ping for a player', () => {
      store.addPendingPing(playerID, 1000);
      expect(store.getLastPingTime(playerID)).toBe(1000);
    });

    it('should maintain multiple pending pings', () => {
      store.addPendingPing(playerID, 1000);
      store.addPendingPing(playerID, 1100);
      store.addPendingPing(playerID, 1200);
      expect(store.getLastPingTime(playerID)).toBe(1200);
    });

    it('should enforce MAX_PENDING_PINGS limit', () => {
      // Add more pings than the limit
      for (let i = 0; i < PendingPingStore.MAX_PENDING_PINGS + 5; i++) {
        store.addPendingPing(playerID, 1000 + i);
      }
      
      // Should have dropped the oldest pings
      expect(store.validateAndConsumePing(playerID, 1000)).toBe(false); // Oldest should be gone
      expect(store.validateAndConsumePing(playerID, 1005)).toBe(true);  // Should still exist
    });
  });

  describe('canReceivePing', () => {
    it('should return true for player with no pending pings', () => {
      expect(store.canReceivePing(playerID)).toBe(true);
    });

    it('should return true for player below limit', () => {
      for (let i = 0; i < PendingPingStore.MAX_PENDING_PINGS - 1; i++) {
        store.addPendingPing(playerID, 1000 + i);
      }
      expect(store.canReceivePing(playerID)).toBe(true);
    });

    it('should return false for player at limit', () => {
      for (let i = 0; i < PendingPingStore.MAX_PENDING_PINGS; i++) {
        store.addPendingPing(playerID, 1000 + i);
      }
      expect(store.canReceivePing(playerID)).toBe(false);
    });
  });

  describe('validateAndConsumePing', () => {
    it('should return false for non-existent player', () => {
      expect(store.validateAndConsumePing(999, 1000)).toBe(false);
    });

    it('should return false for invalid server time', () => {
      store.addPendingPing(playerID, 1000);
      expect(store.validateAndConsumePing(playerID, 2000)).toBe(false);
    });

    it('should return true and consume valid ping', () => {
      store.addPendingPing(playerID, 1000);
      store.addPendingPing(playerID, 1100);
      
      expect(store.validateAndConsumePing(playerID, 1000)).toBe(true);
      expect(store.validateAndConsumePing(playerID, 1000)).toBe(false); // Should be consumed
      expect(store.validateAndConsumePing(playerID, 1100)).toBe(true);  // Should still exist
    });

    it('should handle out-of-order consumption', () => {
      store.addPendingPing(playerID, 1000);
      store.addPendingPing(playerID, 1100);
      store.addPendingPing(playerID, 1200);
      
      // Consume middle ping first
      expect(store.validateAndConsumePing(playerID, 1100)).toBe(true);
      expect(store.validateAndConsumePing(playerID, 1000)).toBe(true);
      expect(store.validateAndConsumePing(playerID, 1200)).toBe(true);
    });
  });

  describe('getLastPingTime', () => {
    it('should return undefined for non-existent player', () => {
      expect(store.getLastPingTime(999)).toBeUndefined();
    });

    it('should return undefined for player with no pings', () => {
      expect(store.getLastPingTime(playerID)).toBeUndefined();
    });

    it('should return last ping time', () => {
      store.addPendingPing(playerID, 1000);
      store.addPendingPing(playerID, 1100);
      expect(store.getLastPingTime(playerID)).toBe(1100);
    });

    it('should update after consumption', () => {
      store.addPendingPing(playerID, 1000);
      store.addPendingPing(playerID, 1100);
      
      store.validateAndConsumePing(playerID, 1100); // Consume last
      expect(store.getLastPingTime(playerID)).toBe(1000);
    });
  });

  describe('removePlayer', () => {
    it('should remove all pending pings for player', () => {
      store.addPendingPing(playerID, 1000);
      store.addPendingPing(playerID, 1100);
      
      store.removePlayer(playerID);
      expect(store.getLastPingTime(playerID)).toBeUndefined();
      expect(store.canReceivePing(playerID)).toBe(true);
    });
  });

  describe('clear', () => {
    it('should remove all pending pings for all players', () => {
      store.addPendingPing(1, 1000);
      store.addPendingPing(2, 1100);
      
      store.clear();
      expect(store.getLastPingTime(1)).toBeUndefined();
      expect(store.getLastPingTime(2)).toBeUndefined();
    });
  });
});
