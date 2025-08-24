import BaseBoardModel from "../../../shared/models/Board";
import ServerCellModel from "./Cell";


/**
 * Server-side implementation of BoardModel with authoritative game logic.
 */
export default class ServerBoardModel extends BaseBoardModel<ServerCellModel> {
   
  get CellModelClass(): typeof ServerCellModel {
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
      // Check for completed objectives
      this.checkBoardObjectives(cellIndex);

      return true;
    }
    return false;
  }

  /**
   * Check for completed objectives after a cell change.
   * TODO: Implement actual objective checking logic.
   * @param cellIndex The index of the cell that was changed.
   * @returns The number of objectives completed (0 for now).
   */
  public checkBoardObjectives(_cellIndex: number): number {
    // TODO: Implement actual objective checking logic
    // - Compare against solution board
    // - Check for completed rows/columns/boxes
    // - Track already completed objectives
    return 0;
  }
}
