import type PUPBaseContract from "../../../extendables/PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";


export default interface CascadeBaseContract extends PUPBaseContract {}
export interface CascadeContractC2S extends CascadeBaseContract, ActionContractC2S {}
export interface CascadeContractS2C extends CascadeBaseContract, ActionContractS2C {}