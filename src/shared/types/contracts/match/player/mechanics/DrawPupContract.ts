import type PUPContract from "../../../components/extendables/PUPContract";
import type IDataContract from "../../../components/base/IDataContract";


export interface DrawPupContract extends IDataContract {}
export interface PupDrawnContract extends PUPContract, IDataContract {
  playerID: number;
  type: number;  
  level: number;
  slotIndex: number;
}
