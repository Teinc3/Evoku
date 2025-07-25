import createActionPacket from "../../../../factory/createActionPacket";
import WaterPUP from "../../../../../../types/enums/actions/match/player/powerups/water";


export const UseCascade = createActionPacket(
  WaterPUP.USE_CASCADE,
  ['clientTime', 'actionID', 'pupID'],
  {}
);

export const CascadeUsed = createActionPacket(
  WaterPUP.CASCADE_USED,
  ['serverTime', 'playerID', 'actionID', 'pupID'],
  {}
);