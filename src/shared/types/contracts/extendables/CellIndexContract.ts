import type IExtendableContract from "../IExtendableContract";

/**
 * An extendible interface for any contract with a CellIndex attribute.
 */
export default interface CellIndexContract extends IExtendableContract {
    cellIndex: number;
}