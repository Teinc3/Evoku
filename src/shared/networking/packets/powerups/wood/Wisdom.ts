import createActionPacket from "../../../factory/createActionPacket";
import WoodPUP from "../../../../types/enums/mechanics/powerups/wood";


export const UseWisdom = createActionPacket(
    WoodPUP.USE_WISDOM, 
    ['clientTime', 'moveID', 'pupID', 'targetID'],
    {}
);

export const WisdomUsed = createActionPacket(
    WoodPUP.WISDOM_USED, 
    ['serverTime', 'playerID', 'moveID', 'pupID', 'targetID', 'cellIndex', 'value'],
    {}
);