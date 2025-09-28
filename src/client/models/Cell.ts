import BaseCellModel from "../../shared/models/Cell";

import type { IPendingCellState } from "../types/gamestate";
import type BaseEffectModel from "../../shared/models/Effect";


/** Client-side implementation of CellModel with pending state for optimistic updates. */
export default class ClientCellModel extends BaseCellModel {
  public pendingCellState: Partial<IPendingCellState>;
  public notes: number[];

  constructor(
    value: number = 0,
    fixed: boolean = false,
    effects: BaseEffectModel[] = []
  ) {
    super(value, fixed, effects);

    this.pendingCellState = {}; // Initialise with no pending properties
    this.notes = [];
  }

  /**
   * Set a pending value for optimistic updates while waiting for server confirmation.
   * @param value The new value to set as pending.
   * @param time Current client time (optional)
   * @returns Whether the pending value was set.
   */
  public setPending(value: number, time?: number): boolean {
    if (!this.validate(value, time)) {
      return false;
    }

    this.pendingCellState.pendingValue = value;
    if (time !== undefined) {
      this.pendingCellState.pendingCooldownEnd = time + BaseCellModel.CELL_COOLDOWN_DURATION;
    }
    return true;
  }

  /**
   * Confirm the pending value and make it the actual value.
   * @param value The confirmed value from the server.
   * @param time Server time
   * @returns Whether the value was confirmed.
   */
  public confirmSet(value: number, time?: number): boolean {
    this.clearPending();
    
    if (!this.validate(value, time)) {
      return false;
    }
    
    this.update(value, time);
    return true;
  }

  /** Reject the pending value and restore the original state. */
  public rejectPending(): void {
    // TODO: Here we might need to be more clear about which pending state we are rejecting
    // As it stands, it clears everything that is pending
    // But different things can be on pending at the same time, but coming from different actionIDs
    this.clearPending();
  }

  /** Clear all pending state. */
  private clearPending(): void {
    this.pendingCellState = {};
  }


  /** Get the current display value (pending if exists, otherwise actual). */
  public getDisplayValue(): number {
    return this.pendingCellState.pendingValue ?? this.value;
  }

  /** Check if this cell has any pending changes. */
  public hasPending(): boolean {
    return (
      this.pendingCellState.pendingValue !== undefined
      || this.pendingCellState.pendingCooldownEnd !== undefined
      || this.pendingCellState.pendingEffects !== undefined
    );
  }

  /** Override existing validate function for base model for client-side pending check */
  public override validate(value: number, time?: number): boolean { 
    // Check if pending value is same as current (dynamic value) or pending
    if (this.pendingCellState?.pendingValue === value || this.value === value) {
      return false;
    }

    return super.validate(value, time);
  }

  /** 
   * Removes all notes
   * 
   * @returns {boolean} Whether any notes were wiped
   */
  public wipeNotes(): boolean {
    if (this.notes.length > 0) {
      this.notes = [];
      return true;
    }
    return false;
  }
}
