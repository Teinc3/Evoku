import { getSudoku } from "sudoku-gen";

import BoardConverter from "./BoardConverter";


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
      expect(result).toHaveLength(81);
      expect(result).toContain(0);
      expect(result).not.toContain("-");
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
      expect(result).toHaveLength(4);
    });

    it("should handle empty cell states array", () => {
      const result = BoardConverter.toCellValues([]);
      
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it("should handle single cell state", () => {
      const mockCellState = [
        { value: 7, fixed: false, effects: [], lastCooldownEnd: 500 }
      ];

      const result = BoardConverter.toCellValues(mockCellState);
      
      expect(result).toEqual([7]);
      expect(result).toHaveLength(1);
    });
  });
});