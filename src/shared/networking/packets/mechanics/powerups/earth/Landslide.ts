import createActionPacket from "../../factory/createActionPacket";
import EarthPUP from "../../../../types/enums/actions/mechanics/powerups/earth";


export const UseLandslide = createActionPacket(
    EarthPUP.USE_LANDSLIDE,
    ['clientTime', 'actionID', 'pupID', 'targetID'],
    {}
);

export const LandslideUsed = createActionPacket(
    EarthPUP.LANDSLIDE_USED,
    ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID', 'cellIndex'], 
    {}
);