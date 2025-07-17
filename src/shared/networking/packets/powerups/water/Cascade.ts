import createActionPacket from "../../../factory/createActionPacket";
import WaterPUP from "../../../../types/enums/mechanics/powerups/water";


export const UseCascade = createActionPacket(
    WaterPUP.USE_CASCADE,
    ['clientTime', 'moveID', 'pupID', 'targetID'],
    {}
);

export const CascadeUsed = createActionPacket(
    WaterPUP.CASCADE_USED,
    ['serverTime', 'playerID', 'moveID', 'pupID', 'targetID'],
    {}
);