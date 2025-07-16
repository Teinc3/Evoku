import type Gameplay from "../../enums/mechanics/gameplay";
import type { SetCellContract, CellSetContract } from "../../contracts/mechanics/SetCellContract";


export default interface GameplayActionMap {
    [Gameplay.SET_CELL]: SetCellContract;
    [Gameplay.CELL_SET]: CellSetContract;
}