import type ICellState from "../types/gamestate/board/cell";
import type BaseEffectModel from "./Effect";


export type CellModelConstructor<PlatformSpecificCellModel extends BaseCellModel>
  = new (value?: number, fixed?: boolean, effects?: BaseEffectModel[]) => PlatformSpecificCellModel;


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
   * Validates if the cell can be set to a new value.
   * @param value The new value to set.
   * @param time Optional, current time
   * @returns Whether the value can be set.
   */
  public validate(value: number, time?: number): boolean {
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
      if (!effect.validateSetValue(time)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Updates the cell's value and cooldown state.
   * @param value The new value to set.
   * @param time Optional, current time
   */
  public update(value: number, time?: number): void {
    this.value = value;
    if (time !== undefined) {
      this.lastCooldownEnd = time + BaseCellModel.CELL_COOLDOWN_DURATION;
    }
  }

  /** @returns The computed hash for each cell based on its properties and effects */
  public computeHash(): number {
    return this.effects.reduce((hash, effect) => {
      return hash + effect.computeHash();
    }, this.value + Number(this.fixed) + (this.lastCooldownEnd % 1000));
  }

  /** @returns Whether the cell contributes to board progress. */
  public progress(solution: number, time?: number): boolean {
    return !this.fixed && this.value === solution
      && this.effects.reduce((progress, effect) => {
        return progress + (effect.blockSetProgress(time) ? 0 : 1);
      }, 0) === 0;
  }
}