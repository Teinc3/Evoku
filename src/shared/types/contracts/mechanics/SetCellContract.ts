import type Gameplay from "@shared/types/enums/mechanics/gameplay";
import CellIndexContract from "./extendables/CellIndexContract";
import ValueContract from "./extendables/ValueContract";
import IDataContract from "../base/IDataContract";


export default interface SetCellBaseContract extends CellIndexContract, ValueContract, IDataContract {
    action: Gameplay.SETCELL;
}