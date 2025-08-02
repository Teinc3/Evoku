import CellModel from "@shared/models/CellModel";

import type { BoardCellStates } from "@shared/types/gamestate/board/cell";


export default class BoardConverter {
  static toBoardArray(sudokuGen: string): number[] {
    return sudokuGen.replaceAll('-', '0').split('').map(Number);
  }

  static toCellValues(cellStates: BoardCellStates): number[] {
    return cellStates.map(cell => cell.value);
  }

  static toBoardCellStates(cellValues: number[]) {
    return cellValues.map((value) => (new CellModel(value, value !== 0)));
  }
}