import createActionPacket from "../../../factory/createActionPacket";
import WoodPUP from "../../../../types/enums/mechanics/powerups/wood";


export const UseWisdom = createActionPacket(
    WoodPUP.USE_WISDOM, 
    ['clientTime', 'actionID', 'pupID', 'targetID'],
    {}
);

export const WisdomUsed = createActionPacket(
    WoodPUP.WISDOM_USED, 
    ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID', 'cellIndex', 'value'],
    {}
);