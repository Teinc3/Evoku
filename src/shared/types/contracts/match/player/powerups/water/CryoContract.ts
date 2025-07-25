import type IDataContract from "../../../../components/base/IDataContract";
import type TargetContract from "../../../../components/extendables/TargetContract";
import type PUPContract from "../../../../components/extendables/PUPContract";
import type CellIndexContract from "../../../../components/extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../../components/extendables/ActionContract";


export default interface CryoBaseContract
  extends PUPContract, CellIndexContract, TargetContract, IDataContract {}
  
export interface CryoContractC2S extends CryoBaseContract, ActionContractC2S {}
export interface CryoContractS2C extends CryoBaseContract, ActionContractS2C {}