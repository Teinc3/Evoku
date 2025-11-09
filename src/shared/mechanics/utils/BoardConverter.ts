import type { BoardCellStates } from "../../types/gamestate/board";


export default class BoardConverter {
  static toBoardArray(sudokuGen: string): number[] {
    return sudokuGen.replaceAll('-', '0').split('').map(Number);
  }

  static toCellValues(cellStates: BoardCellStates): number[] {
    return cellStates.map(cell => cell.value);
  }
}
