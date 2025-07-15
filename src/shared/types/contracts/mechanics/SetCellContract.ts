import type Mechanics from "@shared/types/enums/mechanics/mechanics";
import CellIndexContract from "./extendables/CellIndexContract";
import ValueContract from "./extendables/ValueContract";
import IDataContract from "../base/IDataContract";


export default interface SetCellBaseContract extends CellIndexContract, ValueContract, IDataContract {
    action: Mechanics.SETCELL;
}