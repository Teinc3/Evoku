import createActionPacket from "../../../factory/createActionPacket";
import WoodPUP from "../../../../types/enums/mechanics/powerups/wood";


export const UseEntangle = createActionPacket(
    WoodPUP.USE_ENTANGLE,
    ['clientTime', 'moveID', 'pupID', 'targetID'],
    {}
);

export const EntangleUsed = createActionPacket(
    WoodPUP.ENTANGLE_USED,
    ['serverTime', 'playerID', 'moveID', 'pupID', 'targetID'],
    {}
);