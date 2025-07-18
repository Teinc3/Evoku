import type PUPContract from "../../../extendables/PUPContract";
import type CellIndexContract from "../../../extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../extendables/ActionContract";
import type TargetContract from "../../../extendables/TargetContract";
import type IDataContract from "../../../IDataContract";


export default interface CryoBaseContract extends PUPContract, CellIndexContract, TargetContract, IDataContract {}
export interface CryoContractC2S extends CryoBaseContract, ActionContractC2S {}
export interface CryoContractS2C extends CryoBaseContract, ActionContractS2C {}