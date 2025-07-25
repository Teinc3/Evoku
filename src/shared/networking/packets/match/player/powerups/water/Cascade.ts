import createActionPacket from "../../../../factory/createActionPacket";
import WaterPUPActions from "../../../../../../types/enums/actions/match/player/powerups/water";


export const UseCascade = createActionPacket(
  WaterPUPActions.USE_CASCADE,
  ['clientTime', 'actionID', 'pupID'],
  {}
);

export const CascadeUsed = createActionPacket(
  WaterPUPActions.CASCADE_USED,
  ['serverTime', 'playerID', 'actionID', 'pupID'],
  {}
);