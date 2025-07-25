import type IDataContract from "../../../../components/base/IDataContract";
import type ValueContract from "../../../../components/extendables/ValueContract";
import type TargetContract from "../../../../components/extendables/TargetContract";
import type PUPContract from "../../../../components/extendables/PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../../components/extendables/ActionContract";


export default interface LockBaseContract
  extends PUPContract, ValueContract, TargetContract, IDataContract {}
  
export interface LockContractC2S extends LockBaseContract, ActionContractC2S {}
export interface LockContractS2C extends LockBaseContract, ActionContractS2C {}