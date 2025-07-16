import type PUPBaseContract from "../PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "@shared/types/contracts/base/ActionContract";


export default interface ForgeBaseContract extends PUPBaseContract {}
export interface ForgeContractC2S extends ForgeBaseContract, ActionContractC2S {}
export interface ForgeContractS2C extends ForgeBaseContract, ActionContractS2C {}