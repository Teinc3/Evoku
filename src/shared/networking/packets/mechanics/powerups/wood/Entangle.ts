import createActionPacket from "../../../factory/createActionPacket";
import WoodPUP from "../../../../types/enums/actions/mechanics/powerups/wood";


export const UseEntangle = createActionPacket(
    WoodPUP.USE_ENTANGLE,
    ['clientTime', 'actionID', 'pupID', 'targetID'],
    {}
);

export const EntangleUsed = createActionPacket(
    WoodPUP.ENTANGLE_USED,
    ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID'],
    {}
);