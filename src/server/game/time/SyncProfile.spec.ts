import SyncProfile from '../../models/networking/SyncProfile';


describe('SyncProfile', () => {
  let syncProfile: SyncProfile;
  const initialServerTime = 1000;

  beforeEach(() => {
    syncProfile = new SyncProfile(initialServerTime);
  });

  describe('constructor', () => {
    it('should initialize with default values', () => {
      expect(syncProfile.getRtt()).toBe(0);
      expect(syncProfile.hasInitialSync()).toBe(false);
      expect(syncProfile.getData().initialServerTime).toBe(initialServerTime);
    });
  });

  describe('updateFromPong', () => {
    it('should establish initial sync on first update', () => {
      expect(syncProfile.hasInitialSync()).toBe(false);
      
      syncProfile.updateFromPong(50, 100, 1000, 1050);
      
      expect(syncProfile.hasInitialSync()).toBe(true);
      expect(syncProfile.getRtt()).toBe(100);
      expect(syncProfile.getData().initialClientTime).toBe(1000);
      expect(syncProfile.getData().initialOffset).toBe(50);
    });

    it('should update RTT and offset with median filtering', () => {
      // Add multiple samples to test median filtering
      syncProfile.updateFromPong(40, 80, 1000, 1040);  // offset: 40
      syncProfile.updateFromPong(60, 90, 1100, 1140);  // offset: 60
      syncProfile.updateFromPong(50, 100, 1200, 1240); // offset: 50 (median)
      
      expect(syncProfile.getRtt()).toBe(100);
      expect(syncProfile.getData().offset).toBe(50); // Median of [40, 60, 50] = 50
    });

    it('should maintain sample size limit', () => {
      // Add more than PING_SAMPLE_SIZE samples
      for (let i = 0; i < SyncProfile.PING_SAMPLE_SIZE + 3; i++) {
        syncProfile.updateFromPong(i * 10, i * 20, 1000 + i * 100, 1050 + i * 100);
      }
      
      expect(syncProfile.getData().offsetSamples.length).toBe(SyncProfile.PING_SAMPLE_SIZE);
    });
  });

  describe('time conversion', () => {
    beforeEach(() => {
      syncProfile.updateFromPong(50, 100, 1000, 1050); // offset: 50
    });

    it('should convert client time to server time', () => {
      const clientTime = 1200;
      const serverTime = syncProfile.clientToServerTime(clientTime);
      expect(serverTime).toBe(1150); // 1200 - 50
    });

    it('should convert server time to client time', () => {
      const serverTime = 1150;
      const clientTime = syncProfile.serverToClientTime(serverTime);
      expect(clientTime).toBe(1200); // 1150 + 50
    });

    it('should be symmetric conversions', () => {
      const originalClientTime = 1500;
      const convertedServerTime = syncProfile.clientToServerTime(originalClientTime);
      const backToClientTime = syncProfile.serverToClientTime(convertedServerTime);
      expect(backToClientTime).toBe(originalClientTime);
    });
  });

  describe('calculateCumulativeDrift', () => {
    it('should return 0 before initial sync', () => {
      const drift = syncProfile.calculateCumulativeDrift(1100, 1150);
      expect(drift).toBe(0);
    });

    it('should calculate drift after initial sync', () => {
      syncProfile.updateFromPong(50, 100, 1000, 1050); // Initial sync
      
      // After 200ms client time and 150ms server time
      const drift = syncProfile.calculateCumulativeDrift(1200, 1200);
      expect(drift).toBe(50); // (1200-1000) - (1200-1050) = 200 - 150 = 50
    });

    it('should handle negative drift', () => {
      syncProfile.updateFromPong(50, 100, 1000, 1050); // Initial sync
      
      // Client runs slower than server
      const drift = syncProfile.calculateCumulativeDrift(1150, 1250);
      expect(drift).toBe(-50); // (1150-1000) - (1250-1050) = 150 - 200 = -50
    });
  });

  describe('hasInitialSync', () => {
    it('should return false initially', () => {
      expect(syncProfile.hasInitialSync()).toBe(false);
    });

    it('should return true after first update', () => {
      syncProfile.updateFromPong(50, 100, 1000, 1050);
      expect(syncProfile.hasInitialSync()).toBe(true);
    });
  });

  describe('getRtt', () => {
    it('should return 0 initially', () => {
      expect(syncProfile.getRtt()).toBe(0);
    });

    it('should return updated RTT', () => {
      syncProfile.updateFromPong(50, 150, 1000, 1050);
      expect(syncProfile.getRtt()).toBe(150);
    });
  });

  describe('getData', () => {
    it('should return underlying data structure', () => {
      const data = syncProfile.getData();
      expect(data).toHaveProperty('offset');
      expect(data).toHaveProperty('rtt');
      expect(data).toHaveProperty('offsetSamples');
      expect(data).toHaveProperty('initialServerTime');
      expect(data.initialServerTime).toBe(initialServerTime);
    });
  });
});
