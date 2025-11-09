import createActionPacket from '../../../../factory/createActionPacket';
import MetalPUPActions from '../../../../../../types/enums/actions/match/player/powerups/metal';


export const UseLock = createActionPacket(
  MetalPUPActions.USE_LOCK,
  ['clientTime', 'actionID', 'pupID', 'targetID', 'value'],
  {}
);

export const LockUsed = createActionPacket(
  MetalPUPActions.LOCK_USED,
  ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID', 'value'],
  {}
);
