import type IDataContract from "../../../IDataContract";
import type TargetContract from "../../../extendables/TargetContract";
import type PUPContract from "../../../extendables/PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";


export default interface InfernoBaseContract
  extends PUPContract, CellIndexContract, TargetContract, IDataContract {}
  
export interface InfernoContractC2S extends InfernoBaseContract, ActionContractC2S {}
export interface InfernoContractS2C extends InfernoBaseContract, ActionContractS2C {}