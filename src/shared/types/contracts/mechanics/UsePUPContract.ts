import type IDataContract from "@shared/types/contracts/IDataContract";


/**
 * This is a contract that be extended by all PUP (Power-Up) related contracts.
 * It defines the common fields that are shared across all PUP actions.
 */
export default interface UsePUPContract extends IDataContract {
    // No action field - left for the factory to implement
    time: number;
    playerID: number;
    targetID: number;
    index: number;
    value: number;
}