import type PUPContract from "../../../components/extendables/PUPContract";
import type IDataContract from "../../../components/base/IDataContract";
import type PUPElements from "../../../../enums/elements";


export interface DrawPupContract extends IDataContract {}

export interface PupSpunContract extends IDataContract {
  element: PUPElements;
  slotIndex: number;
}

export interface PupDrawnContract extends PUPContract, IDataContract {
  playerID: number;
  type: number;
  level: number;
  slotIndex: number;
}
