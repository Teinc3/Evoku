import type IDataContract from "../base/IDataContract";


/**
 * The data contract for player information in a game.
 */
export default interface PlayerInfoContract extends IDataContract {
  playerID: number;
  username: string;
  elo: number;
}
