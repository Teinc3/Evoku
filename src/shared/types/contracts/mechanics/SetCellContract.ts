import type { Mechanics } from "@shared/types/contracts/ActionType";
import PlayerActionContract from "./PlayerActionContract";


export default interface SetCellContract extends PlayerActionContract {
    action: Mechanics.SETCELL;
    index: number;
    value: number;
}