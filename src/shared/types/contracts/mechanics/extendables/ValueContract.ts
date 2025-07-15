import type ExtendableContract from "@shared/types/contracts/base/ExtendableContract";


/**
 * An extendible interface for any contract with a value attribute.
 */
export default interface ValueContract extends ExtendableContract {
    value: number;
}