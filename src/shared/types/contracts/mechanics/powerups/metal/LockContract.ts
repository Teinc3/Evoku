import type PUPBaseContract from "../PUPContract";
import type ValueContract from "../../../extendables/ValueContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../base/ActionContract";


export default interface LockBaseContract extends PUPBaseContract, ValueContract {}
export interface LockContractC2S extends LockBaseContract, ActionContractC2S {}
export interface LockContractS2C extends LockBaseContract, ActionContractS2C {}