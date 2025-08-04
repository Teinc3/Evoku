import type ICellEffectState from "../types/gamestate/board/effect";


export default abstract class BaseEffectModel implements ICellEffectState {
  constructor(
    public startedAt: number,
    public lastUntil?: number
  ) {}

  /**
   * Function to determine if the effect blocks setting a value.
   */
  public blockSetValue(time?: number): boolean {
    if (this.lastUntil && time !== undefined) {
      return time < this.lastUntil;
    }
    return false;
  }
}