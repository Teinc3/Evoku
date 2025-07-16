import type Gameplay from "../../enums/mechanics/gameplay";
import type SetCellBaseContract from "../../contracts/mechanics/SetCellContract";


export default interface GameplayActionMap {
    [Gameplay.SETCELL]: SetCellBaseContract;
}