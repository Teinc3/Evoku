import type Gameplay from "../../enums/mechanics/gameplay";
import type { SetCellContract, CellSetContract } from "../../contracts/mechanics/SetCellContract";


export default interface GameplayActionMap {
    [Gameplay.SETCELL]: SetCellContract;
    [Gameplay.CELLSET]: CellSetContract;
}