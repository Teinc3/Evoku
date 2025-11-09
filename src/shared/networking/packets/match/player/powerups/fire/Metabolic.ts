import createActionPacket from "../../../../factory/createActionPacket";
import FirePUPActions from "../../../../../../types/enums/actions/match/player/powerups/fire";


export const UseMetabolic = createActionPacket(
  FirePUPActions.USE_METABOLIC,
  ['clientTime', 'actionID', 'pupID'],
  {}
);

export const MetabolicUsed = createActionPacket(
  FirePUPActions.METABOLIC_USED,
  ['serverTime', 'playerID', 'actionID', 'pupID'],
  {}
);
