import type IDataContract from "./IDataContract";


/**
 * The unified base contract for ANY S2C (Server to Client) contract.
 * This is broadcast by the server to all clients.
 */
export interface ActionContractS2C extends BaseActionContract {
    serverTime: number;
    playerID: number;
}


/**
 * The unified base contract for ANY C2S (Client to Server) contract.
 * This is sent by the client to the server.
 */
export interface ActionContractC2S extends BaseActionContract {
    clientTime: number;
}

/**
 * The base contract for all actions.
 * 
 * This is used to define the structure of an action that can be performed in the game.
 */
export default interface BaseActionContract extends IDataContract {
    moveID: number;
}


// Helper types to extend a generic contract with ActionContractS2C and ActionContractC2S
// Used for converting processed action contracts from packet pipeline into normal data contracts
export type ExtendedContractS2C<GenericContract extends IDataContract> = GenericContract & ActionContractS2C;
export type ExtendedContractC2S<GenericContract extends IDataContract> = GenericContract & ActionContractC2S;