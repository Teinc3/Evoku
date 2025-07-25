import createActionPacket from "../../../../factory/createActionPacket";
import WaterPUPActions from "../../../../../../types/enums/actions/match/player/powerups/water";


export const UseCryo = createActionPacket(
  WaterPUPActions.USE_CRYO,
  ['clientTime', 'actionID', 'pupID', 'targetID', 'cellIndex'],
  {}
);

export const CryoUsed = createActionPacket(
  WaterPUPActions.CRYO_USED,
  ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID', 'cellIndex'],
  {}
);