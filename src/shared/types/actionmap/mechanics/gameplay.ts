import type Gameplay from "../../enums/mechanics/gameplay";
import type { SetCellContract, CellSetContract } from "../../contracts/mechanics/SetCellContract";
import type RejectActionContract from "@shared/types/contracts/mechanics/RejectActionContract";


export default interface GameplayActionMap {
    [Gameplay.SET_CELL]: SetCellContract;
    [Gameplay.CELL_SET]: CellSetContract;
    [Gameplay.REJECT_ACTION]: RejectActionContract
}