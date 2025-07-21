import createActionPacket from '../../factory/createActionPacket';
import MetalPUP from '../../../../types/enums/actions/mechanics/powerups/metal';


export const UseLock = createActionPacket(
    MetalPUP.USE_LOCK,
    ['clientTime', 'actionID', 'pupID', 'targetID', 'value'],
    {}
);

export const LockUsed = createActionPacket(
    MetalPUP.LOCK_USED,
    ['serverTime', 'playerID', 'actionID', 'pupID', 'targetID', 'value'],
    {}
);