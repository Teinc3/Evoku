import type PUPBaseContract from "../../../extendables/PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";


export default interface InfernoBaseContract extends PUPBaseContract, CellIndexContract {}
export interface InfernoContractC2S extends InfernoBaseContract, ActionContractC2S {}
export interface InfernoContractS2C extends InfernoBaseContract, ActionContractS2C {}