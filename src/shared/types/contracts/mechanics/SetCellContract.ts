import type CellIndexContract from "../extendables/CellIndexContract";
import type ValueContract from "../extendables/ValueContract";
import type IDataContract from "../IDataContract";
import type { ActionContractC2S, ActionContractS2C } from "../extendables/ActionContract";


export default interface SetCellBaseContract extends CellIndexContract, ValueContract, IDataContract {}
export interface SetCellContract extends SetCellBaseContract, ActionContractC2S {}
export interface CellSetContract extends SetCellBaseContract, ActionContractS2C {}