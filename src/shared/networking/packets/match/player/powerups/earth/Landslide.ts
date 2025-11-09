import createActionPacket from "../../../../factory/createActionPacket";
import EarthPUPActions from "../../../../../../types/enums/actions/match/player/powerups/earth";


export const UseLandslide = createActionPacket(
  EarthPUPActions.USE_LANDSLIDE,
  ['clientTime', 'actionID', 'pupID', 'targetID'],
  {}
);

export const LandslideUsed = createActionPacket(
  EarthPUPActions.LANDSLIDE_USED,
  ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID', 'cellIndex'], 
  {}
);
