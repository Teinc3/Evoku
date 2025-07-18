import type Gameplay from "../../enums/mechanics/gameplay";
import type { SetCellContract, CellSetContract } from "../../contracts/mechanics/SetCellContract";
import type RejectActionContract from "../../contracts/mechanics/RejectActionContract";
import type { DrawPupContract, PupDrawnContract } from "../../contracts/mechanics/powerups/DrawPupContract";


export default interface GameplayActionMap {
    [Gameplay.SET_CELL]: SetCellContract;
    [Gameplay.CELL_SET]: CellSetContract;
    [Gameplay.REJECT_ACTION]: RejectActionContract;
    [Gameplay.DRAW_PUP]: DrawPupContract;
    [Gameplay.PUP_DRAWN]: PupDrawnContract;
}