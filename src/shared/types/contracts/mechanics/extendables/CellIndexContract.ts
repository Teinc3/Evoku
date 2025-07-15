import type ExtendableContract from "@shared/types/contracts/base/ExtendableContract";


/**
 * An extendible interface for any contract with a CellIndex attribute.
 */
export default interface CellIndexContract extends ExtendableContract {
    cellIndex: number;
}