import type PUPContract from "../../../components/extendables/PUPContract";
import type {
  ActionContractC2S, ActionContractS2C
} from "../../../components/extendables/ActionContract";
import type IDataContract from "../../../components/base/IDataContract";


export interface DrawPupContract extends ActionContractC2S, IDataContract {}
export interface PupDrawnContract
  extends PUPContract, ActionContractS2C, IDataContract {
  type: number;  
  level: number;
  slotIndex: number;
}
