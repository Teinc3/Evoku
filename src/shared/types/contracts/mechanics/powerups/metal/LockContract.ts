import type IDataContract from "../../../IDataContract";
import type ValueContract from "../../../extendables/ValueContract";
import type TargetContract from "../../../extendables/TargetContract";
import type PUPContract from "../../../extendables/PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";


export default interface LockBaseContract
  extends PUPContract, ValueContract, TargetContract, IDataContract {}
  
export interface LockContractC2S extends LockBaseContract, ActionContractC2S {}
export interface LockContractS2C extends LockBaseContract, ActionContractS2C {}