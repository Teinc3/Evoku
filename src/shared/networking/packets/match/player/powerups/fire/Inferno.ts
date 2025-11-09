import createActionPacket from "../../../../factory/createActionPacket";
import FirePUPActions from "../../../../../../types/enums/actions/match/player/powerups/fire";


export const UseInferno = createActionPacket(
  FirePUPActions.USE_INFERNO,
  ['clientTime', 'actionID', 'pupID', 'targetID', 'cellIndex'],
  {}
);

export const InfernoUsed = createActionPacket(
  FirePUPActions.INFERNO_USED,
  ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID', 'cellIndex'],
  {}
);
