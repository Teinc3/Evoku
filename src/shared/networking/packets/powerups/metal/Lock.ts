import createActionPacket from '../../../factory/createActionPacket';
import MetalPUP from '../../../../types/enums/mechanics/powerups/metal';


export const UseLock = createActionPacket(
    MetalPUP.USE_LOCK,
    ['clientTime', 'moveID', 'pupID', 'targetID', 'value'],
    {}
);

export const LockUsed = createActionPacket(
    MetalPUP.LOCK_USED,
    ['serverTime', 'playerID', 'moveID', 'pupID', 'targetID', 'value'],
    {}
);