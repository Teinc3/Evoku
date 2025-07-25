import createActionPacket from "../../../../factory/createActionPacket";
import EarthPUPActions from "../../../../../../types/enums/actions/match/player/powerups/earth";


export const UseExcavate = createActionPacket(
  EarthPUPActions.USE_EXCAVATE, 
  ['clientTime', 'actionID', 'pupID', 'cellIndex'],
  {}
)

export const ExcavateUsed = createActionPacket(
  EarthPUPActions.EXCAVATE_USED, 
  ['serverTime', 'playerID', 'actionID', 'pupID', 'cellIndex'],
  {}
);