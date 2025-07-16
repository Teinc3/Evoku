import type PUPBaseContract from "../PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "@shared/types/contracts/base/ActionContract";


export default interface MetabolicBaseContract extends PUPBaseContract {}
export interface MetabolicContractC2S extends MetabolicBaseContract, ActionContractC2S {}
export interface MetabolicContractS2C extends MetabolicBaseContract, ActionContractS2C {}