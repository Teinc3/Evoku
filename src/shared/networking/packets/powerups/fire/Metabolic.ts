import createActionPacket from "../../../factory/createActionPacket";
import FirePUP from "../../../../types/enums/mechanics/powerups/fire";


export const UseMetabolic = createActionPacket(
    FirePUP.USE_METABOLIC,
    ['clientTime', 'actionID', 'pupID', 'targetID'],
    {}
);

export const MetabolicUsed = createActionPacket(
    FirePUP.METABOLIC_USED,
    ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID'],
    {}
);