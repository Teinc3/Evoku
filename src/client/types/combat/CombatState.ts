import type DefuseType from '../enums/defuse-type';


/**
 * Represents an active incoming attack that the player must defuse.
 */
export default interface CombatState {
  /** The type of powerup being used against the player */
  pupType: number;
  /** The type of defuse required (row, col, or box) */
  defuseType: DefuseType;
  /** Index of the defuse target (0-8 for row/col, 0-8 for box) */
  defuseIndex: number;
  /** Timestamp (ms) when the attack ends */
  endTime: number;
  /** Optional: specific cell indices being targeted (for ghost target rendering) */
  targetCells?: number[];
}
