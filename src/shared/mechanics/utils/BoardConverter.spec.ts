import { getSudoku } from "sudoku-gen";

import BoardConverter from "./BoardConverter";
import { expectToHaveLength } from "../../types/test-utils/cross-framework";


describe("BoardConverter", () => {
  let sudokuGen: ReturnType<typeof getSudoku>;

  beforeAll(() => {
    sudokuGen = getSudoku();
  })

  describe("Static conversion methods", () => {
    it("should convert a sudokuGen string to a board array", () => {
      expect(sudokuGen.puzzle).toContain('-');
      expect(sudokuGen.puzzle).not.toContain('0');

      const result = BoardConverter.toBoardArray(sudokuGen.puzzle);
      expectToHaveLength(result, 81);
      expect(result).toContain(0);
      expect(result).not.toContain('-' as any);
    });

    it("should convert board cell states to values array", () => {
      const mockCellStates = [
        { value: 1, fixed: true, effects: [], lastCooldownEnd: 0 },
        { value: 0, fixed: false, effects: [], lastCooldownEnd: 0 },
        { value: 5, fixed: false, effects: [], lastCooldownEnd: 1000 },
        { value: 9, fixed: true, effects: [], lastCooldownEnd: 0 }
      ];

      const result = BoardConverter.toCellValues(mockCellStates);
      
      expect(result).toEqual([1, 0, 5, 9]);
      expectToHaveLength(result, 4);
    });

    it("should handle empty cell states array", () => {
      const result = BoardConverter.toCellValues([]);
      
      expect(result).toEqual([]);
      expectToHaveLength(result, 0);
    });

    it("should handle single cell state", () => {
      const mockCellState = [
        { value: 7, fixed: false, effects: [], lastCooldownEnd: 500 }
      ];

      const result = BoardConverter.toCellValues(mockCellState);
      
      expect(result).toEqual([7]);
      expectToHaveLength(result, 1);
    });
  });
});