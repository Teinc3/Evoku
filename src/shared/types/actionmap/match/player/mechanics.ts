import type MechanicsActions from "../../../enums/actions/match/player/mechanics";
import type { 
  SetCellContract, CellSetContract
} from "../../../contracts/match/player/mechanics/SetCellContract";
import type {
  DrawPupContract, PupDrawnContract
} from "../../../contracts/match/player/mechanics/DrawPupContract";


export default interface MechanicsActionMap {
  [MechanicsActions.SET_CELL]: SetCellContract;
  [MechanicsActions.CELL_SET]: CellSetContract;
  [MechanicsActions.DRAW_PUP]: DrawPupContract;
  [MechanicsActions.PUP_DRAWN]: PupDrawnContract;
}