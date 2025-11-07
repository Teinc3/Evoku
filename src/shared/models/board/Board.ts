import type { default as BaseCellModel, CellModelConstructor } from "../cell/Cell";
import type { IBoardState } from "../../types/gamestate/board";


/**
 * Model representing the state of a game board.
 */
export default abstract class BaseBoardModel<
  PlatformSpecificCellModel extends BaseCellModel
> implements IBoardState {

  static readonly GLOBAL_COOLDOWN_DURATION = 5000; // 5 seconds
   
  abstract get CellModelClass(): CellModelConstructor<PlatformSpecificCellModel>;

  public readonly board: PlatformSpecificCellModel[];
  public globalLastCooldownEnd: number;

  constructor(cellValues: number[] = []) {
    this.board = [];
    this.globalLastCooldownEnd = 0;

    this.initBoard(cellValues);
  }

  protected initBoard(cellValues: number[]): void {
    for (let i = 0; i < cellValues.length; i++) {
      this.board[i] = new this.CellModelClass(cellValues[i], cellValues[i] !== 0);
    }
  }

  /**
   * Validates if a cell can be set to a new value.
   * @param cellIndex 
   * @param value 
   * @param time 
   * @returns Whether the value can be set.
   */
  public validate(cellIndex: number, value: number, time?: number): boolean {
    // Universal checks
    if (!Number.isInteger(value) || cellIndex < 0 || cellIndex >= this.board.length) {
      return false;
    }

    // If time exists, validate for global cooldown
    if (time !== undefined && this.globalLastCooldownEnd > time) {
      return false;
    }

    const cell = this.board[cellIndex];
    return cell.validate(value, time);
  }

  public update(cellIndex: number, value: number, time?: number): void {
    // Find cell
    if (cellIndex < 0 || cellIndex >= this.board.length) {
      throw new Error("Invalid cell index");
    }
    const cell = this.board[cellIndex];

    // Update cell value
    cell.update(value, time);

    if (time !== undefined) {
      this.globalLastCooldownEnd = time + BaseBoardModel.GLOBAL_COOLDOWN_DURATION;
    }
  }

  /**
   * Computes a hash of the board state, including all board and cell properties.
   * @returns The computed hash of the board state.
   */
  public computeHash(): number {
    let h = 23;
    h = (h * 31 + (this.globalLastCooldownEnd | 0)) | 0;
    for (let i = 0; i < this.board.length; i++) {
      // incorporate index and cell hash with mixing, not plain multiply
      h = (h * 31 + (i + 1)) | 0;
      h = (h * 31 + this.board[i].computeHash()) | 0;
    }
    return h | 0; // Convert uint32 to int32
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