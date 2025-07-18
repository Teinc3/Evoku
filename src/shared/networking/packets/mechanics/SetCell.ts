import createActionPacket from "../../factory/createActionPacket";
import Gameplay from "../../../types/enums/mechanics/gameplay";


export const SetCell = createActionPacket(
    Gameplay.SET_CELL,
    ['clientTime', 'actionID', 'cellIndex', 'value'],
    {}
);

export const CellSet = createActionPacket(
    Gameplay.CELL_SET,
    ['serverTime', 'playerID', 'actionID', 'cellIndex', 'value'],
    {}
);