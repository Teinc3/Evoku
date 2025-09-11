import { createMockEffect } from '@shared/models/utils/MockEffect';
import ServerCellModel from './Cell';
import ServerBoardModel from './Board';


describe('ServerBoardModel (server-specific tests)', () => {
  let board: ServerBoardModel;
  const baseTime = 1000;
  const standardBoardSize = 81; // 9x9 board

  beforeEach(() => {
    board = new ServerBoardModel(new Array(standardBoardSize).fill(0));
  });

  describe('server-specific configuration', () => {
    it('should use ServerCellModel as CellModelClass', () => {
      expect(board.CellModelClass).toBe(ServerCellModel);
    });

    it('should have correct global cooldown duration', () => {
      expect(ServerBoardModel.GLOBAL_COOLDOWN_DURATION).toBe(5000);
    });
  });

  describe('global cooldown management', () => {
    it('should set global cooldown on successful cell change', () => {
      const result = board.setCell(0, 5, baseTime);

      expect(result).toBe(true);
      expect(board.board[0].value).toBe(5);
      expect(board.globalLastCooldownEnd).toBe(
        baseTime + ServerBoardModel.GLOBAL_COOLDOWN_DURATION
      );
    });

    it('should enforce global cooldown', () => {
      // First move sets global cooldown
      board.setCell(0, 1, baseTime);
      expect(board.globalLastCooldownEnd).toBe(baseTime + 5000);

      // Second move during global cooldown should fail
      const duringCooldown = baseTime + 2000;
      const result = board.setCell(1, 2, duringCooldown);
      expect(result).toBe(false);
      expect(board.board[1].value).toBe(0);
    });

    it('should allow moves after global cooldown expires', () => {
      // First move
      board.setCell(0, 1, baseTime);
      expect(board.board[0].value).toBe(1);

      // Second move after global cooldown
      const afterCooldown = baseTime + ServerBoardModel.GLOBAL_COOLDOWN_DURATION + 1;
      const result = board.setCell(1, 2, afterCooldown);
      expect(result).toBe(true);
      expect(board.board[1].value).toBe(2);
    });

    it('should enforce both global and cell cooldowns', () => {
      // Set a cell
      board.setCell(0, 1, baseTime);

      // After global cooldown expires but cell cooldown still active
      const afterGlobalCooldown = baseTime + 6000;
      expect(board.setCell(1, 2, afterGlobalCooldown)).toBe(true); // Different cell works

      // Try to set same cell (should fail due to cell cooldown)
      const afterGlobalCooldown2 = baseTime + 7000;
      expect(board.setCell(0, 3, afterGlobalCooldown2)).toBe(false);

      // After both cooldowns expire
      const afterBothCooldowns = baseTime + 12000;
      expect(board.setCell(0, 3, afterBothCooldowns)).toBe(true);
    });
  });

  describe('server integration scenarios', () => {
    it('should handle rapid move attempts correctly', () => {
      const moves = [
        { index: 0, value: 1, time: baseTime },
        { index: 1, value: 2, time: baseTime + 1000 },
        { index: 2, value: 3, time: baseTime + 2000 },
        { index: 3, value: 4, time: baseTime + 6000 }, // After global cooldown
      ];

      const results = moves.map(move => 
        board.setCell(move.index, move.value, move.time)
      );

      expect(results[0]).toBe(true);  // First succeeds
      expect(results[1]).toBe(false); // Blocked by global cooldown
      expect(results[2]).toBe(false); // Blocked by global cooldown
      expect(results[3]).toBe(true);  // After global cooldown
    });

    it('should handle complex effect and cooldown interactions', () => {
      // Create board with effects on specific cells
      const blockingEffect = createMockEffect(baseTime, baseTime + 3000, true);
      board.board[5].effects.push(blockingEffect);

      // Try to set affected cell
      expect(board.setCell(5, 7, baseTime + 1000)).toBe(false); // Blocked by effect

      // Set different cell (should work)
      expect(board.setCell(10, 7, baseTime + 1000)).toBe(true);

      // After effect expires but global cooldown active
      expect(board.setCell(5, 7, baseTime + 4000)).toBe(false); // Global cooldown

      // After global cooldown expires and effect expired
      expect(board.setCell(5, 7, baseTime + 7000)).toBe(true);
    });

    it('should maintain state consistency under server load', () => {
      // Simulate multiple rapid operations
      const operations = [
        () => board.setCell(0, 1, baseTime),
        () => board.board[0].computeHash(),
        () => board.validate(1, 2, baseTime + 1000),
        () => board.computeHash(),
        () => board.setCell(1, 2, baseTime + 6000),
      ];

      const results = operations.map(op => {
        try {
          return op();
        } catch (e) {
          return e;
        }
      });

      // First set should succeed
      expect(results[0]).toBe(true);
      
      // Hash operations should work
      expect(typeof results[1]).toBe('number');
      expect(typeof results[3]).toBe('number');
      
      // Validation during cooldown should fail
      expect(results[2]).toBe(false);
      
      // Set after cooldown should succeed
      expect(results[4]).toBe(true);
    });
  });

  describe('checkBoardObjectives', () => {
    it('should return 0 for any cell index (TODO implementation)', () => {
      // Test various cell indices
      expect(board.checkBoardObjectives(0)).toBe(0);
      expect(board.checkBoardObjectives(40)).toBe(0);
      expect(board.checkBoardObjectives(80)).toBe(0);
    });

    it('should handle edge cases gracefully', () => {
      // Test with invalid indices (should not crash)
      expect(() => board.checkBoardObjectives(-1)).not.toThrow();
      expect(() => board.checkBoardObjectives(81)).not.toThrow();
    });

    it('should be called when setCell succeeds', () => {
      const checkBoardObjectivesSpy = jest.spyOn(board, 'checkBoardObjectives');
      
      // This should succeed and call checkBoardObjectives
      const result = board.setCell(0, 5, baseTime);
      
      expect(result).toBe(true);
      expect(checkBoardObjectivesSpy).toHaveBeenCalledWith(0);
      
      checkBoardObjectivesSpy.mockRestore();
    });

    it('should not be called when setCell fails validation', () => {
      const checkBoardObjectivesSpy = jest.spyOn(board, 'checkBoardObjectives');
      
      // This should fail validation due to invalid cell index
      const result = board.setCell(-1, 5, baseTime); // Invalid cell index
      
      expect(result).toBe(false);
      expect(checkBoardObjectivesSpy).not.toHaveBeenCalled();
      
      checkBoardObjectivesSpy.mockRestore();
    });
  });

  // Note: Core functionality is tested in the base class' unit test
  // These tests focus only on server-specific extensions like global cooldown management
});
