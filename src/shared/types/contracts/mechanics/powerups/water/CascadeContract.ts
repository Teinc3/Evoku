import type PUPBaseContract from "../PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../base/ActionContract";


export default interface CascadeBaseContract extends PUPBaseContract {}
export interface CascadeContractC2S extends CascadeBaseContract, ActionContractC2S {}
export interface CascadeContractS2C extends CascadeBaseContract, ActionContractS2C {}