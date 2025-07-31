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

    it("should convert the board array into cell states", () => {
      const boardArray = BoardConverter.toBoardArray(sudokuGen.puzzle);
      const cellStates = BoardConverter.toBoardCellStates(boardArray);
      expect(cellStates).toHaveLength(81);

      for (let i = 0; i < cellStates.length; i++) {
        expect(cellStates[i]).toHaveProperty("cellIndex", i);
        expect(cellStates[i]).toHaveProperty("value", boardArray[i]);
        expect(cellStates[i]).toHaveProperty("fixed", boardArray[i] !== 0);
      }
    });

    it("should convert cell states back to board array", () => {
      const boardArray = BoardConverter.toBoardArray(sudokuGen.puzzle);
      const cellStates = BoardConverter.toBoardCellStates(boardArray);
      const convertedBackArray = BoardConverter.toCellValues(cellStates);
      expect(convertedBackArray).toEqual(boardArray);
    });
  });
});