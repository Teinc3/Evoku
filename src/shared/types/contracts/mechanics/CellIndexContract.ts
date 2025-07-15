import type ExtendableContract from "@shared/types/contracts/mechanics/ExtendableContract";


/**
 * An extendible interface for any contract with a CellIndex attribute.
 */
export default interface CellIndexContract extends ExtendableContract {
    cellIndex: number;
}