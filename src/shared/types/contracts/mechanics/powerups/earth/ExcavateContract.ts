import type PUPBaseContract from "../PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "@shared/types/contracts/base/ActionContract";


export default interface ExcavateBaseContract extends PUPBaseContract, CellIndexContract {}
export interface ExcavateContractC2S extends ExcavateBaseContract, ActionContractC2S {}
export interface ExcavateContractS2C extends ExcavateBaseContract, ActionContractS2C {}