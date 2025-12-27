import type MechanicsActions from "../../../enums/actions/match/player/mechanics";
import type {
  SetCellContract, CellSetContract
} from "../../../contracts/match/player/mechanics";
import type {
  DrawPupContract, PupDrawnContract, PupSpunContract
} from "../../../contracts/match/player/mechanics";


export default interface MechanicsActionMap {
  [MechanicsActions.SET_CELL]: SetCellContract;
  [MechanicsActions.CELL_SET]: CellSetContract;
  [MechanicsActions.DRAW_PUP]: DrawPupContract;
  [MechanicsActions.PUP_DRAWN]: PupDrawnContract;
  [MechanicsActions.PUP_SPUN]: PupSpunContract;
}
