import type PUPBaseContract from "../../../extendables/PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";


export default interface ExcavateBaseContract extends PUPBaseContract, CellIndexContract {}
export interface ExcavateContractC2S extends ExcavateBaseContract, ActionContractC2S {}
export interface ExcavateContractS2C extends ExcavateBaseContract, ActionContractS2C {}