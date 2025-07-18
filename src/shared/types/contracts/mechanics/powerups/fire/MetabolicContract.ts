import type PUPContract from "../../../extendables/PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";
import type IDataContract from "../../../IDataContract";


export default interface MetabolicBaseContract extends PUPContract, IDataContract {}
export interface MetabolicContractC2S extends MetabolicBaseContract, ActionContractC2S {}
export interface MetabolicContractS2C extends MetabolicBaseContract, ActionContractS2C {}