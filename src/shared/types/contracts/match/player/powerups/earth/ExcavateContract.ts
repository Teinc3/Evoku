import type IDataContract from "../../../../components/base/IDataContract";
import type PUPContract from "../../../../components/extendables/PUPContract";
import type CellIndexContract from "../../../../components/extendables/CellIndexContract";
import type { ActionContractC2S, ActionContractS2C } from "../../../../components/extendables/ActionContract";


export default interface ExcavateBaseContract
  extends PUPContract, CellIndexContract, IDataContract {}
  
export interface ExcavateContractC2S extends ExcavateBaseContract, ActionContractC2S {}
export interface ExcavateContractS2C extends ExcavateBaseContract, ActionContractS2C {}