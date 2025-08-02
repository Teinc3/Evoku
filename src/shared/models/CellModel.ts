import EffectModel from "./EffectModel";

import type ICellState from "@shared/types/gamestate/board/cell";

/**
 * Model representing a cell in the game board.
 */
export default class CellModel implements ICellState {
  static readonly CELL_COOLDOWN_DURATION = 10000; // 10 seconds

  public lastCooldownEnd: number;

  constructor(
    public value: number = 0,
    public fixed: boolean = false,
    public effects: EffectModel[] = []
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
    if (value < 0 || value > 9 || this.fixed || (time !== undefined && this.lastCooldownEnd > time)) {
      return false;
    }

    for (const effect of this.effects) {
      if (effect.blockSetValue(time)) {
        return false;
      }
    }

    this.value = value;
    if (time !== undefined) {
      this.lastCooldownEnd = time + CellModel.CELL_COOLDOWN_DURATION;
    }
    return true;
  }
}