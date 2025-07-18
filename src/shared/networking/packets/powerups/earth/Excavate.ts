import createActionPacket from "../../../factory/createActionPacket";
import EarthPUP from "../../../../types/enums/mechanics/powerups/earth";


export const UseExcavate = createActionPacket(
    EarthPUP.USE_EXCAVATE, 
    ['clientTime', 'actionID', 'pupID', 'targetID', 'cellIndex'],
    {}
)

export const ExcavateUsed = createActionPacket(
    EarthPUP.EXCAVATE_USED, 
    ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID', 'cellIndex'],
    {}
);