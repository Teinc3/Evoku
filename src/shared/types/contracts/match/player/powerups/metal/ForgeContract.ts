import type IDataContract from "../../../../components/base/IDataContract";
import type PUPContract from "../../../../components/extendables/PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../../components/extendables/ActionContract";


export default interface ForgeBaseContract extends PUPContract, IDataContract {}
export interface ForgeContractC2S extends ForgeBaseContract, ActionContractC2S {}
export interface ForgeContractS2C extends ForgeBaseContract, ActionContractS2C {}