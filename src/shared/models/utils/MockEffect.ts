import BaseEffectModel from "../Effect";


export default class MockEffect extends BaseEffectModel {
  constructor(
    startedAt: number,
    lastUntil?: number,
    private _canBlockSet: boolean = true,
    private _canBlockProgress: boolean = true
  ) {
    super(startedAt, lastUntil);
  }

  public override validateSetValue(time?: number): boolean {
    if (this._canBlockSet) {
      // Let internal logic figure out validation
      return super.validateSetValue(time);
    }
    return true; // Always allow if effect can't block
  }

  public override blockSetProgress(time?: number): boolean {
    if (this._canBlockProgress) {
      // Let internal logic figure out blocking
      return super.blockSetProgress(time);
    }
    return false; // Always disallow blocking if can't block progress
  }

  public override computeHash(): number {
    return super.computeHash() + (this._canBlockSet ? 1 : 0) + (this._canBlockProgress ? 2 : 0);
  }
}