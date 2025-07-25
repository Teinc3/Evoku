import type ValueContract from "../../../components/extendables/ValueContract";
import type CellIndexContract from "../../../components/extendables/CellIndexContract";
import type { 
  ActionContractC2S, ActionContractS2C
} from "../../../components/extendables/ActionContract";
import type IDataContract from "../../../components/base/IDataContract";


export default interface SetCellBaseContract 
  extends CellIndexContract, ValueContract, IDataContract {}
  
export interface SetCellContract extends SetCellBaseContract, ActionContractC2S {}
export interface CellSetContract extends SetCellBaseContract, ActionContractS2C {}