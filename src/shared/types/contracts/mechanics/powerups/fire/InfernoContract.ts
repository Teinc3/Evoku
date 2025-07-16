import type PUPBaseContract from "../PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "@shared/types/contracts/base/ActionContract";


export default interface InfernoBaseContract extends PUPBaseContract, CellIndexContract {}
export interface InfernoContractC2S extends InfernoBaseContract, ActionContractC2S {}
export interface InfernoContractS2C extends InfernoBaseContract, ActionContractS2C {}