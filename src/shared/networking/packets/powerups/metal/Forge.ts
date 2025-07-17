import createActionPacket from "../../../factory/createActionPacket";
import MetalPUP from "../../../../types/enums/mechanics/powerups/metal";


export const UseForge = createActionPacket(
    MetalPUP.USE_FORGE, 
    ['clientTime', 'moveID', 'pupID', 'targetID'],
    {}
);

export const ForgeUsed = createActionPacket(
    MetalPUP.FORGE_USED, 
    ['serverTime', 'playerID', 'moveID', 'pupID', 'targetID'],
    {}
);