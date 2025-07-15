import type Mechanics from "@shared/types/enums/mechanics/mechanics";
import type IDataContract from "@shared/types/contracts/IDataContract";


export default interface SetCellBaseContract extends IDataContract {
    action: Mechanics.SETCELL;
    index: number;
    value: number;
}