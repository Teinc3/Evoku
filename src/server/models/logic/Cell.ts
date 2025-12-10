import BaseCellModel from "../../../shared/models/cell";

import type BaseEffectModel from "@shared/models/effect";


/**
 * Server-side implementation of CellModel with authoritative validation and setting.
 */
export default class ServerCellModel extends BaseCellModel {

  constructor(
    value: number = 0,
    fixed: boolean = false,
    effects: BaseEffectModel[] = [],
    goldenObjectiveActive: boolean = false,
    public pupProgressSet: boolean = false
  ) {
    super(value, fixed, effects, goldenObjectiveActive);
  }

  /**
   * Authoritative method to validate and set a cell value on the server.
   * @param value The new value to set.
   * @param time Current server time
   * @returns Whether the value was successfully set.
   */
  public set(value: number, time?: number): boolean {
    if (!this.validate(value, time)) {
      return false;
    }
    
    this.update(value, time);
    return true;
  }
}
