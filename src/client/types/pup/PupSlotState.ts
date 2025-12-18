/**
 * Represents the state of a single PUP slot.
 */
export interface PupSlotState {
  /** The PUP ID (index into pup.json config), or null if empty */
  pupID: number | null;

  /** The level of the PUP (1-5), or null if empty */
  level: number | null;

  /** Whether the PUP is currently on cooldown */
  onCooldown: boolean;

  /** Timestamp when cooldown ends (ms), or null if not on cooldown */
  cooldownEnd: number | null;
}

/**
 * Creates an empty slot state.
 */
export function createEmptySlotState(): PupSlotState {
  return {
    pupID: null,
    level: null,
    onCooldown: false,
    cooldownEnd: null
  };
}
