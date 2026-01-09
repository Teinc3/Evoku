import { CombatOutcome } from '../enums';


/**
 * Represents a floating text notification to display over the board.
 */
export default interface FloatingText {
  /** Unique identifier for this floating text instance */
  id: number;
  /** The text content to display */
  text: string;
  /** The outcome type which determines styling */
  outcome: CombatOutcome;
  /** Timestamp when the text was created */
  createdAt: number;
}
