import type IDataContract from "../../../../components/base/IDataContract";
import type TargetContract from "../../../../components/extendables/TargetContract";
import type PUPContract from "../../../../components/extendables/PUPContract";
import type CellIndexContract from "../../../../components/extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../../components/extendables/ActionContract";


export default interface InfernoBaseContract
  extends PUPContract, CellIndexContract, TargetContract, IDataContract {}
  
export interface InfernoContractC2S extends InfernoBaseContract, ActionContractC2S {}
export interface InfernoContractS2C extends InfernoBaseContract, ActionContractS2C {}