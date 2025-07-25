import createActionPacket from "../../../../factory/createActionPacket";
import MetalPUPActions from "../../../../../../types/enums/actions/match/player/powerups/metal";


export const UseForge = createActionPacket(
  MetalPUPActions.USE_FORGE, 
  ['clientTime', 'actionID', 'pupID'],
  {}
);

export const ForgeUsed = createActionPacket(
  MetalPUPActions.FORGE_USED, 
  ['serverTime', 'playerID', 'actionID', 'pupID'],
  {}
);