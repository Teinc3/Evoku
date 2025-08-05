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

    // Board cell states converter removed due to platform specific implementations
    // Can be added in the future if needed
  });
});