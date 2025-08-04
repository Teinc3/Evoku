import BaseCellModel from "../../models/Cell";

import type { BoardCellStates } from "../../types/gamestate/board/cell";


export default class BoardConverter {
  static toBoardArray(sudokuGen: string): number[] {
    return sudokuGen.replaceAll('-', '0').split('').map(Number);
  }

  static toCellValues(cellStates: BoardCellStates): number[] {
    return cellStates.map(cell => cell.value);
  }

  static toBoardCellStates(cellValues: number[]) {
    return cellValues.map(value => (new BaseCellModel(value, value !== 0)));
  }
}