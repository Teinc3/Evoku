import type IDataContract from "@shared/types/contracts/IDataContract";


/**
 * The unified base contract for ANY action taken by a player inside a game.
 * This is sent by a client and broadcast by the server.
 */
export default interface PlayerActionContract extends IDataContract {
    // No action field - left for the factory to implement
    time: number;
    playerID: number; // Outbound we will still encode it to ensure uniformity
}