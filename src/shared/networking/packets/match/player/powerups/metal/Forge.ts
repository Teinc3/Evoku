import createActionPacket from "../../../../factory/createActionPacket";
import MetalPUP from "../../../../../../types/enums/actions/match/player/powerups/metal";


export const UseForge = createActionPacket(
  MetalPUP.USE_FORGE, 
  ['clientTime', 'actionID', 'pupID'],
  {}
);

export const ForgeUsed = createActionPacket(
  MetalPUP.FORGE_USED, 
  ['serverTime', 'playerID', 'actionID', 'pupID'],
  {}
);