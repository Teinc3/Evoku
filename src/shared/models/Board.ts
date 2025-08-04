import BoardConverter from "../mechanics/utils/BoardConverter";

import type IBoardState from "../types/gamestate/board";
import type BaseCellModel from "./Cell";


/**
 * Model representing the state of a game board.
 */
export default class BaseBoardModel implements IBoardState {
  static readonly GLOBAL_COOLDOWN_DURATION = 5000; // 5 seconds

  public readonly board: BaseCellModel[];
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
        this.globalLastCooldownEnd = time + BaseBoardModel.GLOBAL_COOLDOWN_DURATION;
      }
      return true;
    }
    return false;
  }

  /**
   * When a cell is set, check for board objectives that might be completed.
   */
  public checkBoardObjectives(_cell: BaseCellModel): number {
    // First, compare the new value to the ideal board state.
    // Is it equal? If not, this move is wrong. No objective completed.

    // Then, check for each row, column and box, if they have all 9 filled cells.
    // Make sure that this objective has not already been completed.

    // For now, return 0
    return 0;
  }
}