import BaseBoardModel from "../../../shared/models/board";
import { ServerCellModel } from ".";


/**
 * Server-side implementation of BoardModel with authoritative game logic.
 */
export default class ServerBoardModel extends BaseBoardModel<ServerCellModel> {
   
  get CellModelClass() {
    return ServerCellModel;
  }

  /**
   * Authoritative method to validate and set a cell value on the server.
   * @param cellIndex The index of the cell to set.
   * @param value The new value to set.
   * @param time Current server time
   * @returns Whether the value was successfully set.
   */
  public setCell(cellIndex: number, value: number, time?: number): boolean {
    if (!this.validate(cellIndex, value, time)) {
      return false;
    }

    const cell = this.board[cellIndex];
    if (cell.set(value, time)) {

      // Update global cooldown state
      if (time !== undefined) {
        this.globalLastCooldownEnd = time + BaseBoardModel.GLOBAL_COOLDOWN_DURATION;
      }

      return true;
    }
    return false;
  }

  /** @returns BoardProgress: Percentage (Rounded) of cells  */
  public progress(solution: number[], time?: number): number {
    const correct = this.board.reduce((count, cell, index) => {
      return count + (cell.progress(solution[index], time) ? 1 : 0);
    }, 0)

    const total = this.board.reduce((count, cell) => {
      return count + (cell.fixed ? 0 : 1);
    }, 0);

    if (total === 0) {
      return 100;
    }
    return Math.round(correct / total * 100);
  }
}
