import createActionPacket from "../../../factory/createActionPacket";
import WaterPUP from "../../../../types/enums/mechanics/powerups/water";


export const UseCryo = createActionPacket(
    WaterPUP.USE_CRYO,
    ['clientTime', 'actionID', 'pupID', 'targetID', 'cellIndex'],
    {}
);

export const CryoUsed = createActionPacket(
    WaterPUP.CRYO_USED,
    ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID', 'cellIndex'],
    {}
);