import createActionPacket from "../../../factory/createActionPacket";
import FirePUP from "../../../../../types/enums/actions/mechanics/powerups/fire";


export const UseInferno = createActionPacket(
  FirePUP.USE_INFERNO,
  ['clientTime', 'actionID', 'pupID', 'targetID', 'cellIndex'],
  {}
);

export const InfernoUsed = createActionPacket(
  FirePUP.INFERNO_USED,
  ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID', 'cellIndex'],
  {}
);