import type ICellEffectState from "../types/gamestate/board/effect";


export default abstract class BaseEffectModel implements ICellEffectState {
  constructor(
    public startedAt: number,
    public lastUntil?: number
  ) {}

  /**
   * Function to determine if the effect allows setting a new value.
   */
  public validateSetValue(time?: number): boolean {
    if (this.lastUntil && time !== undefined) {
      return time >= this.lastUntil;
    }
    return true;
  }
}