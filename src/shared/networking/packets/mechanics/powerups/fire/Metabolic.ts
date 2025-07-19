import createActionPacket from "../../../factory/createActionPacket";
import FirePUP from "../../../../types/enums/actions/mechanics/powerups/fire";


export const UseMetabolic = createActionPacket(
    FirePUP.USE_METABOLIC,
    ['clientTime', 'actionID', 'pupID'],
    {}
);

export const MetabolicUsed = createActionPacket(
    FirePUP.METABOLIC_USED,
    ['serverTime', 'playerID', 'actionID', 'pupID'],
    {}
);