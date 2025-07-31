import type { BoardCellStates } from "@shared/types/gamestate";


export default class BoardConverter {
  static toBoardArray(sudokuGen: string): number[] {
    return sudokuGen.replaceAll('-', '0').split('').map(Number);
  }

  static toCellValues(cellStates: BoardCellStates): number[] {
    return cellStates.map(cell => cell.value);
  }

  static toBoardCellStates(cellValues: number[]): BoardCellStates {
    return cellValues.map((value, index) => ({
      cellIndex: index,
      value: value,
      fixed: value !== 0,
    }));
  }
}