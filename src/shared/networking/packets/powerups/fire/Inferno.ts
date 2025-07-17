import createActionPacket from "../../../factory/createActionPacket";
import FirePUP from "../../../../types/enums/mechanics/powerups/fire";


export const UseInferno = createActionPacket(
    FirePUP.USE_INFERNO,
    ['clientTime', 'moveID', 'pupID', 'targetID', 'cellIndex'],
    {}
);

export const InfernoUsed = createActionPacket(
    FirePUP.INFERNO_USED,
    ['serverTime', 'playerID', 'moveID', 'pupID', 'targetID', 'cellIndex'],
    {}
);