import type PUPBaseContract from "../../../extendables/PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";


export default interface CryoBaseContract extends PUPBaseContract, CellIndexContract {}
export interface CryoContractC2S extends CryoBaseContract, ActionContractC2S {}
export interface CryoContractS2C extends CryoBaseContract, ActionContractS2C {}