import type { Mechanics } from "@shared/types/contracts/ActionType";
import type IDataContract from "@shared/types/contracts/IDataContract";


export default interface SetCellContract extends IDataContract {
    action: Mechanics.SETCELL;
    time: number;
    playerID: number;
    index: number;
    value: number;
}