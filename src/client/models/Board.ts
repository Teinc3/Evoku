import BaseBoardModel from "../../shared/models/board";
import ClientCellModel from "./Cell";


/**
 * Client-side implementation of BoardModel with pending state for optimistic updates.
 */
export default class ClientBoardModel extends BaseBoardModel<ClientCellModel> {   
  get CellModelClass(): typeof ClientCellModel {
    return ClientCellModel;
  }
  
  constructor(cellValues: number[] = []) {
    super(cellValues);
  }
  
  public pendingGlobalCooldownEnd?: number;

  /**
   * Set a pending cell value for optimistic updates while waiting for server confirmation.
   * @param cellIndex The index of the cell to set as pending.
   * @param value The new value to set as pending.
   * @param time Current client time (optional)
   * @returns Whether the pending value was set.
   */
  public setPendingCell(cellIndex: number, value: number, time?: number): boolean {
    if (!this.validate(cellIndex, value, time)) {
      return false;
    }

    const cell = this.board[cellIndex];
    if (cell.setPending(value, time)) {
      // Set pending global cooldown
      if (time !== undefined) {
        this.pendingGlobalCooldownEnd = time + BaseBoardModel.GLOBAL_COOLDOWN_DURATION;
      }
      return true;
    }
    return false;
  }

  /**
   * Confirm a pending cell value from server response.
   * @param cellIndex The index of the cell to confirm.
   * @param value The confirmed value from the server.
   * @param time (approximate) clientTime when the action occurred.
   * @returns Whether the value was confirmed.
   */
  public confirmCellSet(cellIndex: number, value: number, time?: number): boolean {
    if (cellIndex < 0 || cellIndex >= this.board.length) {
      return false;
    }

    const cell = this.board[cellIndex];
    if (cell.confirmSet(value, time)) {
      // Update actual global cooldown
      if (time !== undefined) {
        this.globalLastCooldownEnd = time + BaseBoardModel.GLOBAL_COOLDOWN_DURATION;
      }
      this.clearPendingGlobal();
      return true;
    }
    return false;
  }

  /**
   * Reject a pending cell value (server rejected the move).
   * @param cellIndex The index of the cell to reject.
   */
  public rejectCellSet(cellIndex: number): void {
    if (cellIndex < 0 || cellIndex >= this.board.length) {
      return;
    }

    const cell = this.board[cellIndex];
    cell.rejectPending();
    this.clearPendingGlobal();
  }

  /** Clear pending global state. */
  private clearPendingGlobal(): void {
    this.pendingGlobalCooldownEnd = undefined;
  }

  /** Toggles a note for a given cell. */
  public toggleNote(cellIndex: number, value: number): boolean {
    if (cellIndex < 0 || cellIndex >= this.board.length) {
      return false;
    }
    const cell = this.board[cellIndex];
    if (cell.fixed || cell.value > 0 || cell.hasPending()) {
      return false;
    }
    const noteIndex = cell.notes.indexOf(value);
    if (noteIndex > -1) {
      cell.notes.splice(noteIndex, 1);
    } else {
      cell.notes.push(value);
      cell.notes.sort((a, b) => a - b);
    }
    return true;
  }

  /** Clears a cell's value and notes. */
  public clearCell(cellIndex: number): void {
    if (cellIndex < 0 || cellIndex >= this.board.length) {
      return;
    }
    const cell = this.board[cellIndex];
    if (cell.fixed) {
      return;
    }
    cell.update(0, undefined);
    cell.notes = [];
  }

  /** Get the current display global cooldown end (pending if exists, otherwise actual). */
  public getDisplayGlobalCooldownEnd(): number {
    return this.pendingGlobalCooldownEnd ?? this.globalLastCooldownEnd;
  }

  /** Check if the board has any pending changes. */
  public hasPendingChanges(): boolean {
    return this.pendingGlobalCooldownEnd !== undefined;
  }

  public override validate(cellIndex: number, value: number, time?: number): boolean {
    // Check for global cooldown
    if (time !== undefined && time < this.getDisplayGlobalCooldownEnd()) {
      return false;
    }
    return super.validate(cellIndex, value, time);
  }
}
