import type ICellState from "../types/gamestate/board/cell";
import type BaseEffectModel from "./Effect";


/**
 * Model representing a cell in the game board.
 */
export default class BaseCellModel implements ICellState {
  static readonly CELL_COOLDOWN_DURATION = 10000; // 10 seconds

  public lastCooldownEnd: number;

  constructor(
    public value: number = 0,
    public fixed: boolean = false,
    public effects: BaseEffectModel[] = []
  ) {
    this.lastCooldownEnd = 0;
  }

  /**
   * Sets the value of the cell.
   * @param value The new value to set.
   * @param time Optional, current time
   * @returns Whether the value was successfully set.
   */
  public set(value: number, time?: number): boolean {
    // Universal Validation
    if (value < 0 || value > 9 || this.fixed) {
      return false;
    }

    // If time exists, validate for cooldown
    if (time !== undefined && this.lastCooldownEnd > time) {
      return false;
    }

    // If any effects exist, check if they block setting the value
    for (const effect of this.effects) {
      if (effect.blockSetValue(time)) {
        return false;
      }
    }

    // All checks passed, set value
    this.value = value;
    if (time !== undefined) {
      this.lastCooldownEnd = time + BaseCellModel.CELL_COOLDOWN_DURATION;
    }
    return true;
  }
}