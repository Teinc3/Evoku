import createActionPacket from "../../../../factory/createActionPacket";
import WoodPUPActions from "../../../../../../types/enums/actions/match/player/powerups/wood";


export const UseWisdom = createActionPacket(
  WoodPUPActions.USE_WISDOM, 
  ['clientTime', 'actionID', 'pupID'],
  {}
);

export const WisdomUsed = createActionPacket(
  WoodPUPActions.WISDOM_USED, 
  ['serverTime', 'playerID', 'actionID', 'pupID', 'cellIndex', 'value'],
  {}
);