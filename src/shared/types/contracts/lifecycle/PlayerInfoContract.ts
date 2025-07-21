import type IDataContract from "../IDataContract";


/**
 * The data contract for player information in a game.
 */
export default interface PlayerInfoContract extends IDataContract {
    playerID: number;
    username: string;
}