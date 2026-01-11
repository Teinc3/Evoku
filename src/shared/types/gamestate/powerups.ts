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
  //effects: ISlotEffect[]; // Effect on the SLOT itself, not of the PUP
}

export interface IPUPState {
  pupID: number;
  type: number;
  level: number;
  /** 
   * If the PUP has an effect that is pending to be applied.
   * 
   * For example, a Cyro PUP waiting to be deflected by the defender.
   * This attribute stores the details of the effect (which slot? Which player? etc.)
   */
  pendingEffect?: ISlotEffect;
}

export interface ISlotEffect {
  targetID: number;
  cellIndex?: number;
  slotIndex?: number;
  value?: number;
  /** Server-only: tracked timeout handle used to cancel pending Yang effects */
  serverTimeoutID?: ReturnType<typeof setTimeout>;
}
