import type IExtendableContract from "../base/IExtendableContract";


/**
 * The base contract for all actions.
 * 
 * This is used to define the structure of an action that can be performed in the game.
 */
export default interface BaseActionContract extends IExtendableContract {
  actionID: number;
}

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
