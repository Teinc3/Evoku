export interface IPUPSlotState {
  /** Diffuse type of the powerup. Can be made an ENUM in the future */
  slotIndex: number;
  /** Timestamp when the cooldown ends */
  lastCooldownEnd: number;
  /**
   * Client-only optimistic cooldown end timestamp.
   * 
   * When set, the UI can immediately render a cooldown overlay before the
   * server-confirmed `lastCooldownEnd` arrives.
   */
  pendingCooldownEnd?: number;
  /** If the slot is locked */
  locked: boolean;
  pup?: IPUPState;
  //effects: ISlotEffect[];
}

export interface IPUPState {
  pupID: number;
  type: number;
  level: number;
}
