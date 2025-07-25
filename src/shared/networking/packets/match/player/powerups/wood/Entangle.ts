import createActionPacket from "../../../../factory/createActionPacket";
import WoodPUPActions from "../../../../../../types/enums/actions/match/player/powerups/wood";


export const UseEntangle = createActionPacket(
  WoodPUPActions.USE_ENTANGLE,
  ['clientTime', 'actionID', 'pupID', 'targetID'],
  {}
);

export const EntangleUsed = createActionPacket(
  WoodPUPActions.ENTANGLE_USED,
  ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID'],
  {}
);