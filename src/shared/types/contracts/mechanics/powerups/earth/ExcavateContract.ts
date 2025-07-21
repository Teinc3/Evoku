import type PUPContract from "../../../extendables/PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";
import type IDataContract from "../../../IDataContract";


export default interface ExcavateBaseContract extends PUPContract, CellIndexContract, IDataContract {}
export interface ExcavateContractC2S extends ExcavateBaseContract, ActionContractC2S {}
export interface ExcavateContractS2C extends ExcavateBaseContract, ActionContractS2C {}