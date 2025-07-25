import type PlayerInfoContract from "../../components/custom/PlayerInfoContract";
import type IDataContract from "../../components/base/IDataContract";


/**
 * The data contract for when a match is found in the queue.
 * 
 * Attributes:
 * - `myID`: The player's ID in the match
 * - `players`: An array of player information contracts for the players in the match.
 */
export default interface MatchFoundContract extends IDataContract {
  myID: number; // Player's ID in the match
  players: PlayerInfoContract[];
}