import { createMockEffect } from './utils/MockEffect';
import BaseCellModel from './Cell';
import BaseBoardModel from './Board';


// Concrete implementation for testing since BaseBoardModel is abstract
class TestCellModel extends BaseCellModel {
  // Minimal implementation needed for testing
}

class TestBoardModel extends BaseBoardModel<TestCellModel> {
  // @eslint-disable-next-line @typescript-eslint/naming-convention
  get CellModelClass(): typeof TestCellModel {
    return TestCellModel;
  }
}


describe('BaseBoardModel', () => {
  let board: TestBoardModel;
  const baseTime = 1000;
  const standardBoardSize = 81;

  beforeEach(() => {
    board = new TestBoardModel(new Array(standardBoardSize).fill(0));
  });

  describe('constructor', () => {
    it('should create empty board with default values', () => {
      const emptyBoard = new TestBoardModel();
      expect(emptyBoard.board).toEqual([]);
      expect(emptyBoard.globalLastCooldownEnd).toBe(0);
    });

    it('should create board with provided cell values', () => {
      const values = [1, 2, 3, 0, 0, 0, 7, 8, 9];
      const customBoard = new TestBoardModel(values);

      expect(customBoard.board).toHaveLength(9);
      expect(customBoard.board[0].value).toBe(1);
      expect(customBoard.board[1].value).toBe(2);
      expect(customBoard.board[2].value).toBe(3);
      expect(customBoard.board[6].value).toBe(7);
      expect(customBoard.board[8].value).toBe(9);
    });

    it('should create cells with correct fixed status', () => {
      const values = [1, 0, 3, 0, 5];
      const customBoard = new TestBoardModel(values);

      expect(customBoard.board[0].fixed).toBe(true);  // Non-zero = fixed
      expect(customBoard.board[1].fixed).toBe(false); // Zero = not fixed
      expect(customBoard.board[2].fixed).toBe(true);  // Non-zero = fixed
      expect(customBoard.board[3].fixed).toBe(false); // Zero = not fixed
      expect(customBoard.board[4].fixed).toBe(true);  // Non-zero = fixed
    });

    it('should use correct CellModelClass', () => {
      expect(board.CellModelClass).toBe(TestCellModel);
      board.board.forEach(cell => {
        expect(cell).toBeInstanceOf(TestCellModel);
      });
    });
  });

  describe('static properties', () => {
    it('should have correct global cooldown duration', () => {
      expect(BaseBoardModel.GLOBAL_COOLDOWN_DURATION).toBe(5000);
    });
  });

  describe('validate method', () => {
    it('should validate correct cell operations', () => {
      expect(board.validate(0, 5, baseTime)).toBe(true);
      expect(board.validate(40, 1, baseTime)).toBe(true);
      expect(board.validate(80, 9, baseTime)).toBe(true);
    });

    it('should reject invalid cell indices', () => {
      expect(board.validate(-1, 5, baseTime)).toBe(false);
      expect(board.validate(standardBoardSize, 5, baseTime)).toBe(false);
      expect(board.validate(100, 5, baseTime)).toBe(false);
    });

    it('should validate without time parameter', () => {
      expect(board.validate(0, 5)).toBe(true);
      expect(board.validate(-1, 5)).toBe(false);
    });

    it('should respect global cooldown', () => {
      board.globalLastCooldownEnd = baseTime + 3000;

      expect(board.validate(0, 5, baseTime + 1000)).toBe(false); // During cooldown
      expect(board.validate(0, 5, baseTime + 4000)).toBe(true);  // After cooldown
    });

    it('should delegate to cell validation', () => {
      board.board[0].fixed = true;
      expect(board.validate(0, 5, baseTime)).toBe(false);

      board.board[1].lastCooldownEnd = baseTime + 5000;
      expect(board.validate(1, 3, baseTime + 1000)).toBe(false);
    });

    it('should handle edge case indices', () => {
      expect(board.validate(0, 5, baseTime)).toBe(true);
      expect(board.validate(standardBoardSize - 1, 5, baseTime)).toBe(true);
    });
  });

  describe('update method', () => {
    it('should update cell value and global cooldown', () => {
      board.update(0, 7, baseTime);

      expect(board.board[0].value).toBe(7);
      expect(board.globalLastCooldownEnd).toBe(baseTime + BaseBoardModel.GLOBAL_COOLDOWN_DURATION);
    });

    it('should update without time parameter', () => {
      board.update(5, 3);

      expect(board.board[5].value).toBe(3);
      expect(board.globalLastCooldownEnd).toBe(0);
    });

    it('should throw for invalid cell index', () => {
      expect(() => board.update(-1, 5, baseTime)).toThrow('Invalid cell index');
      expect(() => board.update(standardBoardSize, 5, baseTime)).toThrow('Invalid cell index');
      expect(() => board.update(100, 5, baseTime)).toThrow('Invalid cell index');
    });

    it('should update global cooldown correctly', () => {
      board.update(0, 1, baseTime);
      const firstCooldownEnd = board.globalLastCooldownEnd;

      board.update(1, 2, baseTime + 1000);
      const secondCooldownEnd = board.globalLastCooldownEnd;

      expect(secondCooldownEnd).toBe(baseTime + 1000 + 5000);
      expect(secondCooldownEnd).toBeGreaterThan(firstCooldownEnd);
    });

    it('should call cell update method', () => {
      const spy = jest.spyOn(board.board[0], 'update');

      board.update(0, 5, baseTime);

      expect(spy).toHaveBeenCalledWith(5, baseTime);
      spy.mockRestore();
    });
  });

  describe('computeHash method', () => {
    it('should compute hash based on board state', () => {
      const hash1 = board.computeHash();

      board.board[0].value = 5;
      const hash2 = board.computeHash();

      expect(hash1).not.toBe(hash2);
    });

    it('should include global cooldown in hash', () => {
      const hash1 = board.computeHash();

      board.globalLastCooldownEnd = 5000;
      const hash2 = board.computeHash();

      expect(hash1).not.toBe(hash2);
    });

    it('should include all cell states in hash', () => {
      const hash1 = board.computeHash();

      // Change multiple cells
      board.board[0].value = 1;
      board.board[10].value = 2;
      board.board[20].value = 3;
      const hash2 = board.computeHash();

      expect(hash1).not.toBe(hash2);
    });

    it('should produce consistent hashes for same state', () => {
      const board1 = new TestBoardModel([1, 2, 3]);
      const board2 = new TestBoardModel([1, 2, 3]);

      board1.globalLastCooldownEnd = 1000;
      board2.globalLastCooldownEnd = 1000;

      expect(board1.computeHash()).toBe(board2.computeHash());
    });

    it('should handle empty board', () => {
      const emptyBoard = new TestBoardModel();
      expect(emptyBoard.computeHash()).toEqual(expect.any(Number));
    });

    it('should handle large boards', () => {
      const largeValues = new Array(1000).fill(0).map((_, i) => i % 10);
      const largeBoard = new TestBoardModel(largeValues);
      expect(largeBoard.computeHash()).toEqual(expect.any(Number));
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
      const mixedBoard = new TestBoardModel(new Array(standardBoardSize).fill(0));
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
      const mixedBoard = new TestBoardModel(mixedValues);

      const solution = new Array(9).fill(7);
      mixedBoard.board[1].value = 7; // Correct non-fixed cell
      mixedBoard.board[2].value = 7; // Correct non-fixed cell

      // 2 correct out of 7 non-fixed cells = ~28.57%
      const progress = mixedBoard.progress(solution, baseTime);
      expect(progress).toBeCloseTo(28.57, 0);
    });
  });

  describe('global cooldown behavior', () => {
    it('should initialize with no cooldown', () => {
      expect(board.globalLastCooldownEnd).toBe(0);
    });

    it('should set cooldown correctly on update', () => {
      board.update(0, 5, baseTime);
      expect(board.globalLastCooldownEnd).toBe(baseTime + 5000);
    });

    it('should respect cooldown in validation', () => {
      board.globalLastCooldownEnd = baseTime + 3000;

      expect(board.validate(0, 5, baseTime + 1000)).toBe(false);
      expect(board.validate(0, 5, baseTime + 2999)).toBe(false); // One before end
      expect(board.validate(0, 5, baseTime + 3000)).toBe(true); // Exactly at end
    });

    it('should handle multiple cooldown updates', () => {
      board.update(0, 1, baseTime);
      const firstEnd = board.globalLastCooldownEnd;

      board.update(1, 2, baseTime + 1000);
      const secondEnd = board.globalLastCooldownEnd;

      board.update(2, 3, baseTime + 8000);
      const thirdEnd = board.globalLastCooldownEnd;

      expect(secondEnd).toBeGreaterThan(firstEnd);
      expect(thirdEnd).toBeGreaterThan(secondEnd);
      expect(thirdEnd).toBe(baseTime + 8000 + 5000);
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid operations correctly', () => {
      // Multiple validations without changes
      const hash1 = board.computeHash();
      for (let i = 0; i < 10; i++) {
        board.validate(i % standardBoardSize, (i % 9) + 1, baseTime + i);
      }
      const hash2 = board.computeHash();
      expect(hash1).toBe(hash2); // No changes from validation

      // Single update should change hash
      board.update(0, 5, baseTime);
      const hash3 = board.computeHash();
      expect(hash2).not.toBe(hash3);
    });

    it('should handle mixed fixed and regular cell scenarios', () => {
      // Set up mixed board
      board.board[0].value = 1;
      board.board[0].fixed = true;
      board.board[1].value = 0;
      board.board[1].fixed = false;

      // Validation should respect fixed status
      expect(board.validate(0, 9, baseTime)).toBe(false); // Fixed cell
      expect(board.validate(1, 9, baseTime)).toBe(true);  // Regular cell

      // Progress calculation
      const solution = new Array(standardBoardSize).fill(1);
      solution[0] = 1; // Matches fixed cell
      solution[1] = 1; // Different from regular cell

      const progress = board.progress(solution, baseTime);
      expect(progress).toBe(0); // Only fixed cell matches, which doesn't count
    });

    it('should handle effects across multiple cells', () => {
      const effect1 = createMockEffect(baseTime, baseTime + 2000, true);
      const effect2 = createMockEffect(baseTime, baseTime + 4000, false);

      board.board[0].effects = [effect1];
      board.board[1].effects = [effect2];

      // First cell blocked, second allowed
      expect(board.validate(0, 5, baseTime + 1000)).toBe(false);
      expect(board.validate(1, 5, baseTime + 1000)).toBe(true);

      // First cell unblocked, second still allowed
      expect(board.validate(0, 5, baseTime + 3000)).toBe(true);
      expect(board.validate(1, 5, baseTime + 3000)).toBe(true);
    });

    it('should maintain consistency under stress', () => {
      const operations = 100;
      const initialHash = board.computeHash();

      // Many validation operations
      for (let i = 0; i < operations; i++) {
        board.validate(i % standardBoardSize, (i % 9) + 1, baseTime + i);
      }

      // Hash should be unchanged after validations
      expect(board.computeHash()).toBe(initialHash);

      // Single update should change hash
      board.update(0, 5, baseTime);
      expect(board.computeHash()).not.toBe(initialHash);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle empty board operations', () => {
      const emptyBoard = new TestBoardModel();

      expect(emptyBoard.validate(0, 5, baseTime)).toBe(false);
      expect(() => emptyBoard.update(0, 5, baseTime)).toThrow();
      expect(emptyBoard.computeHash()).toEqual(expect.any(Number));
      expect(emptyBoard.progress([], baseTime)).toEqual(expect.any(Number));
    });

    it('should handle extreme time values', () => {
      board.globalLastCooldownEnd = Number.MAX_SAFE_INTEGER;
      expect(board.validate(0, 5, 1000)).toBe(false);

      board.globalLastCooldownEnd = 0;
      expect(board.validate(0, 5, Number.MAX_SAFE_INTEGER)).toBe(true);
    });

    it('should handle boards with different sizes', () => {
      const sizes = [1, 4, 16, 25, 36, 49, 64, 100];

      sizes.forEach(size => {
        const values = new Array(size).fill(0);
        const testBoard = new TestBoardModel(values);

        expect(testBoard.board).toHaveLength(size);
        expect(testBoard.computeHash()).toEqual(expect.any(Number));

        if (size > 0) {
          expect(testBoard.validate(0, 5, baseTime)).toBe(true);
          expect(testBoard.validate(size - 1, 5, baseTime)).toBe(true);
          expect(testBoard.validate(size, 5, baseTime)).toBe(false);
        }
      });
    });

    it('should handle fractional time values', () => {
      board.update(0, 5, baseTime + 0.5);
      expect(board.globalLastCooldownEnd).toBe(baseTime + 0.5 + 5000);

      expect(board.validate(1, 3, baseTime + 5000)).toBe(false); // Still on cooldown
      expect(board.validate(1, 3, baseTime + 5001)).toBe(true);  // After cooldown
    });

    it('should handle concurrent state access patterns', () => {
      // Simulate concurrent read/write patterns
      const originalHash = board.computeHash();

      // Multiple concurrent "reads" (validations)
      const validationResults = [];
      for (let i = 0; i < 10; i++) {
        validationResults.push(board.validate(i % standardBoardSize, 5, baseTime));
      }

      // State should be unchanged
      expect(board.computeHash()).toBe(originalHash);

      // All validations of valid operations should succeed
      expect(validationResults.every(result => result === true)).toBe(true);
    });
  });

  describe('board state consistency', () => {
    it('should maintain cell count consistency', () => {
      const initialCount = board.board.length;

      // Various operations shouldn't change cell count
      board.update(0, 5, baseTime);
      board.validate(1, 3, baseTime);
      board.computeHash();
      board.progress([1, 2, 3], baseTime);

      expect(board.board.length).toBe(initialCount);
    });

    it('should maintain cell type consistency', () => {
      board.board.forEach(cell => {
        expect(cell).toBeInstanceOf(TestCellModel);
        expect(cell).toBeInstanceOf(BaseCellModel);
      });

      // After operations, cells should still be correct type
      board.update(0, 5, baseTime);
      expect(board.board[0]).toBeInstanceOf(TestCellModel);
    });

    it('should handle state serialization scenarios', () => {
      // Set up complex state
      board.update(0, 5, baseTime);
      board.board[1].fixed = true;
      board.board[2].effects = [createMockEffect(baseTime, baseTime + 1000)];
      board.globalLastCooldownEnd = baseTime + 3000;

      const hash = board.computeHash();

      // Hash should be deterministic
      expect(board.computeHash()).toBe(hash);
      expect(board.computeHash()).toBe(hash);
    });
  });
});
