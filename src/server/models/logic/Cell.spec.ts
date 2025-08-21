import MockEffect from '@shared/models/utils/MockEffect';
import ServerCellModel from './Cell';


describe('ServerCellModel (server-specific tests)', () => {
  let cell: ServerCellModel;
  const baseTime = 1000;

  beforeEach(() => {
    cell = new ServerCellModel();
  });

  describe('server-specific cooldown behavior', () => {
    it('should have correct cooldown duration', () => {
      expect(ServerCellModel.CELL_COOLDOWN_DURATION).toBe(10000);
    });

    it('should set cooldown on successful value change', () => {
      const result = cell.set(5, baseTime);

      expect(result).toBe(true);
      expect(cell.value).toBe(5);
      expect(cell.lastCooldownEnd).toBe(baseTime + ServerCellModel.CELL_COOLDOWN_DURATION);
    });

    it('should reject setting during cooldown', () => {
      // First set
      cell.set(1, baseTime);
      expect(cell.value).toBe(1);

      // Try to set again before cooldown expires
      const duringCooldown = baseTime + 5000; // 5 seconds later
      const result = cell.set(2, duringCooldown);

      expect(result).toBe(false);
      expect(cell.value).toBe(1); // Should remain unchanged
    });

    it('should allow setting after cooldown expires', () => {
      // First set
      cell.set(1, baseTime);
      expect(cell.value).toBe(1);

      // Set again after cooldown expires
      const afterCooldown = baseTime + ServerCellModel.CELL_COOLDOWN_DURATION + 1;
      const result = cell.set(2, afterCooldown);

      expect(result).toBe(true);
      expect(cell.value).toBe(2);
      expect(cell.lastCooldownEnd).toBe(afterCooldown + ServerCellModel.CELL_COOLDOWN_DURATION);
    });
  });

  describe('server integration scenarios', () => {
    it('should handle rapid successive calls correctly', () => {
      const times = [1000, 1100, 1200, 1300, 1400];
      const results = times.map(time => cell.set(Math.floor(time / 1000), time));

      expect(results[0]).toBe(true);  // First succeeds
      expect(results[1]).toBe(false); // Rest fail due to cooldown
      expect(results[2]).toBe(false);
      expect(results[3]).toBe(false);
      expect(results[4]).toBe(false);
    });

    it('should handle complex effect and cooldown interactions', () => {
      const shortEffect = new MockEffect(baseTime, baseTime + 2000, true);
      const longEffect = new MockEffect(baseTime, baseTime + 8000, false);
      const effectCell = new ServerCellModel(0, false, [shortEffect, longEffect]);

      // Blocked by first effect
      expect(effectCell.set(1, baseTime + 1000)).toBe(false);

      // First effect expired, should work
      expect(effectCell.set(2, baseTime + 3000)).toBe(true);

      // Now on cooldown
      expect(effectCell.set(3, baseTime + 4000)).toBe(false);

      // Both cooldown and second effect expired
      expect(effectCell.set(4, baseTime + 15000)).toBe(true);
    });
  });

  // Note: Core functionality (validation, hashing, progress, etc.) is tested in shared/models/Cell.spec.ts
  // These tests focus only on server-specific extensions like cooldown management
});
