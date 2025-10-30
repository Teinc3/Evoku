import createActionPacket from "../../../../factory/createActionPacket";
import WaterPUPActions from "../../../../../../types/enums/actions/match/player/powerups/water";


export const UsePurity = createActionPacket(
  WaterPUPActions.USE_PURITY,
  ['clientTime', 'actionID', 'pupID'],
  {}
);

export const PurityUsed = createActionPacket(
  WaterPUPActions.PURITY_USED,
  ['serverTime', 'playerID', 'actionID', 'pupID'],
  {}
);