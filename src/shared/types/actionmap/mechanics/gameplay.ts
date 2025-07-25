import type MechanicsActions from "../../enums/actions/match/player/mechanics";
import type { SetCellContract, CellSetContract } from "../../contracts/mechanics/SetCellContract";
import type RejectActionContract from "../../contracts/mechanics/RejectActionContract";
import type {
  DrawPupContract, PupDrawnContract
} from "../../contracts/mechanics/powerups/DrawPupContract";


export default interface GameplayActionMap {
  [MechanicsActions.SET_CELL]: SetCellContract;
  [MechanicsActions.CELL_SET]: CellSetContract;
  [MechanicsActions.REJECT_ACTION]: RejectActionContract;
  [MechanicsActions.DRAW_PUP]: DrawPupContract;
  [MechanicsActions.PUP_DRAWN]: PupDrawnContract;
}