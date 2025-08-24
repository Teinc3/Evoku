import type ICellEffectState from "../types/gamestate/board/effect";


export default abstract class BaseEffectModel implements ICellEffectState {
  constructor(
    public startedAt: number,
    public lastUntil?: number
  ) {}

  /**
   * Whether this effect can block setting new cell values.
   * Subclasses must implement this to define their blocking behavior.
   */
  protected abstract get canBlockSet(): boolean;

  /**
   * Whether this effect can block progress contribution.
   * Subclasses must implement this to define their progress blocking behavior.
   */
  protected abstract get canBlockProgress(): boolean;

  /**
   * Function to determine if the effect allows setting a new value.
   */
  public validateSetValue(time?: number): boolean {
    return !this.canBlockSet
      || (this.lastUntil !== undefined && (time === undefined || time >= this.lastUntil));
  }

  /**
   * Computes the effect's state hash.
   * @returns A number representing the effect's state hash.
   */
  public computeHash(): number {
    let h = 13;
    h = (h * 31 + (this.startedAt | 0)) | 0;
    h = (h * 31 + ((this.lastUntil ?? 0) | 0)) | 0;
    h = (h * 31 + (this.canBlockSet ? 1 : 0)) | 0;
    h = (h * 31 + (this.canBlockProgress ? 2 : 0)) | 0;
    return h | 0; // Convert uint32 to int32
  }

  /**
   * Checks if the effect blocks setting progress on a cell.
   * @param time Optional, current time to check against the effect's duration.
   * @returns Whether the effect blocks setting progress.
   */
  public blockSetProgress(time?: number): boolean {
    return this.canBlockProgress
      && time !== undefined && (this.lastUntil === undefined || time < this.lastUntil);
  }
}