import { ByteCodec, ShortCodec } from "@shared/networking/codecs/primitive";
import createActionPackets from "@shared/networking/factory/createActionPackets";
import Gameplay from "@shared/types/enums/mechanics/gameplay";

import type SetCellBaseContract from "@shared/types/contracts/mechanics/SetCellContract";


export default createActionPackets<SetCellBaseContract>(Gameplay.SETCELL, {
    index: ShortCodec, // Might fk up for 16*16 as bytes are signed, so take short
    value: ByteCodec
});