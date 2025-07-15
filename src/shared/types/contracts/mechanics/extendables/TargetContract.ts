import type ExtendableContract from "@shared/types/contracts/base/ExtendableContract";


/**
 * An extendible interface for any contract with a targetable attribute.
 */
export default interface TargetContract extends ExtendableContract {
    targetID: number;
}