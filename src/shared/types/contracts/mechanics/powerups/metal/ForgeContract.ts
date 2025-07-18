import type PUPContract from "../../../extendables/PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";
import type IDataContract from "../../../IDataContract";


export default interface ForgeBaseContract extends PUPContract, IDataContract {}
export interface ForgeContractC2S extends ForgeBaseContract, ActionContractC2S {}
export interface ForgeContractS2C extends ForgeBaseContract, ActionContractS2C {}