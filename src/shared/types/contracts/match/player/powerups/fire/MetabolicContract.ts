import type IDataContract from "../../../../components/base/IDataContract";
import type PUPContract from "../../../../components/extendables/PUPContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../../components/extendables/ActionContract";


export default interface MetabolicBaseContract extends PUPContract, IDataContract {}
export interface MetabolicContractC2S extends MetabolicBaseContract, ActionContractC2S {}
export interface MetabolicContractS2C extends MetabolicBaseContract, ActionContractS2C {}