import { createMockEffect } from '@shared/utils/MockEffect';
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

  describe('progress method', () => {
    it('should calculate progress correctly with empty board', () => {
      const solution = new Array(standardBoardSize).fill(1);
      expect(board.progress(solution, baseTime)).toBe(0);
    });

    it('should calculate progress with some correct cells', () => {
      const solution = new Array(standardBoardSize).fill(5);

      // Set some cells to correct values
      board.board[0].value = 5;
      board.board[1].value = 5;
      board.board[2].value = 5;

      const progressPercentage = board.progress(solution, baseTime);
      expect(progressPercentage).toBeCloseTo(3.7, 0); // 3/81 * 100 ≈ 3.7%
    });

    it('should not count fixed cells in progress calculation', () => {
      const solution = new Array(standardBoardSize).fill(7);

      // Create board with some fixed cells
      const mixedBoard = new ServerBoardModel(new Array(standardBoardSize).fill(0));
      mixedBoard.board[0].value = 7;
      mixedBoard.board[0].fixed = true; // Fixed - shouldn't count
      mixedBoard.board[1].value = 7;
      mixedBoard.board[1].fixed = false; // Not fixed - should count

      const progressPercentage = mixedBoard.progress(solution, baseTime);
      expect(progressPercentage).toBeCloseTo(1.23, 0); // 1/81 * 100 ≈ 1.23%
    });

    it('should work without time parameter', () => {
      const solution = new Array(standardBoardSize).fill(3);
      board.board[0].value = 3;

      expect(board.progress(solution)).toBeGreaterThan(0);
    });

    it('should handle all cells correct', () => {
      const solution = new Array(standardBoardSize).fill(9);

      // Set all cells to correct value
      board.board.forEach(cell => {
        cell.value = 9;
      });

      expect(board.progress(solution, baseTime)).toBe(100); // Should be 100%
    });

    it('should handle all cells fixed', () => {
      const solution = new Array(standardBoardSize).fill(4);

      // Make all cells fixed
      board.board.forEach(cell => {
        cell.value = 4;
        cell.fixed = true;
      });

      // Should be 100%
      expect(board.progress(solution, baseTime)).toBe(100);
    });

    it('should handle effects blocking progress', () => {
      const solution = new Array(standardBoardSize).fill(6);
      const blockingEffect = createMockEffect(baseTime, baseTime + 3000);

      board.board[0].value = 6;
      board.board[0].effects = [blockingEffect];

      // Progress blocked by effect (implementation depends on effect details)
      const progressDuringEffect = board.progress(solution, baseTime + 1000);
      const progressAfterEffect = board.progress(solution, baseTime + 4000);

      expect(progressDuringEffect).toBe(0);
      expect(progressAfterEffect).toBeCloseTo(100/81, 0);
    });

    it('should handle mismatched solution array length', () => {
      const shortSolution = [1, 2, 3]; // Much shorter than board
      board.board[0].value = 1;
      board.board[1].value = 2;

      // Should handle gracefully without crashing
      expect(() => board.progress(shortSolution, baseTime)).not.toThrow();
    });

    it('should calculate denominator correctly', () => {
      // Create board with mix of fixed and non-fixed cells
      const mixedValues = new Array(9).fill(0);
      mixedValues[0] = 1; // Will be fixed
      mixedValues[4] = 5; // Will be fixed
      const mixedBoard = new ServerBoardModel(mixedValues);

      const solution = new Array(9).fill(7);
      mixedBoard.board[1].value = 7; // Correct non-fixed cell
      mixedBoard.board[2].value = 7; // Correct non-fixed cell

      // 2 correct out of 7 non-fixed cells = ~28.57%
      const progress = mixedBoard.progress(solution, baseTime);
      expect(progress).toBeCloseTo(28.57, 0);
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

});
