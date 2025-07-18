import type PUPContract from "../../../extendables/PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";
import type IDataContract from "../../../IDataContract";


export default interface CascadeBaseContract extends PUPContract, IDataContract {}
export interface CascadeContractC2S extends CascadeBaseContract, ActionContractC2S {}
export interface CascadeContractS2C extends CascadeBaseContract, ActionContractS2C {}