import type BaseEffectModel from "../effect";
import type { ICellState } from "../../types/gamestate/board";


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
    public effects: BaseEffectModel[] = [],
    public goldenObjectiveActive: boolean = false
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
    if (!Number.isInteger(value) || value < 0 || value > 9 || this.fixed) {
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
    let h = 17;
    h = (h * 31 + this.value) | 0;
    h = (h * 31 + (this.fixed ? 1 : 0)) | 0;
    h = (h * 31 + (this.lastCooldownEnd | 0)) | 0;
    for (const effect of this.effects) {
      h = (h * 31 + effect.computeHash()) | 0;
    }
    return h | 0; // Convert uint32 to int32
  }

  /** @returns Whether the cell contributes to board progress. */
  public progress(solution: number, time?: number): boolean {
    return !this.fixed && this.value === solution
      && this.effects.every(effect => !effect.blockSetProgress(time));
  }
}
