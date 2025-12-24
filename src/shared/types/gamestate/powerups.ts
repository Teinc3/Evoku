export interface IPUPSlotState {
  /** Diffuse type of the powerup. Can be made an ENUM in the future */
  diffuseType: number;
  /** Timestamp when the cooldown ends */
  lastCooldownEnd: number;
  pup?: IPUPState;
}

export interface IPUPState {
  pupID: number;
  type: number;
  level: number;
}
