import type CellIndexContract from "../extendables/CellIndexContract";
import type ValueContract from "../extendables/ValueContract";
import type IDataContract from "../base/IDataContract";
import type { ExtendedContractC2S, ExtendedContractS2C } from "../base/ActionContract";


export default interface SetCellBaseContract extends CellIndexContract, ValueContract, IDataContract {}

export type SetCellContract = ExtendedContractC2S<SetCellBaseContract>;
export type CellSetContract = ExtendedContractS2C<SetCellBaseContract>;