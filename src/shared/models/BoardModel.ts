import BoardConverter from "@shared/mechanics/utils/BoardConverter";

import type IBoardState from "@shared/types/gamestate/board";
import CellModel from "./CellModel";


/**
 * Model representing the state of a game board.
 */
export default class BoardStateModel implements IBoardState {
  static readonly GLOBAL_COOLDOWN_DURATION = 5000; // 5 seconds

  public readonly board: CellModel[];
  public globalLastCooldownEnd: number;

  constructor(cellValues: number[] = []) {
    this.board = BoardConverter.toBoardCellStates(cellValues);
    this.globalLastCooldownEnd = 0;
  }

  public initBoard(cellValues: number[]): void {
    const boardCellStates = BoardConverter.toBoardCellStates(cellValues)
    for (let i = 0; i < cellValues.length; i++) {
      this.board[i] = boardCellStates[i];
    }
  }

  public setCell(cellIndex: number, value: number, time?: number): boolean {
    if (
      cellIndex < 0 || cellIndex >= this.board.length
      || time !== undefined && time < this.globalLastCooldownEnd
    ) {
      return false; // Invalid cell index
    }

    const cell = this.board[cellIndex];
    if (cell.set(value, time)) {
      if (time !== undefined) {
        this.globalLastCooldownEnd = time + BoardStateModel.GLOBAL_COOLDOWN_DURATION;
      }
      return true;
    }
    return false;
  }
}