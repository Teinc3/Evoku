import createActionPacket from "../../../factory/createActionPacket";
import EarthPUP from "../../../../types/enums/mechanics/powerups/earth";


export const UseLandslide = createActionPacket(
    EarthPUP.USE_LANDSLIDE,
    ['clientTime', 'moveID', 'pupID', 'targetID'],
    {}
);

export const LandslideUsed = createActionPacket(
    EarthPUP.LANDSLIDE_USED,
    ['serverTime', 'playerID', 'moveID', 'pupID', 'targetID', 'cellIndex'], 
    {}
);