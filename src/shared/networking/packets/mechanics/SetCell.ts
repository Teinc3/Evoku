import ByteCodec from "@shared/networking/codecs/primitive/ByteCodec";
import ShortCodec from "@shared/networking/codecs/primitive/ShortCodec";
import createPlayerActionPacket from "@shared/networking/factory/createPlayerActionPacket";
import Mechanics from "@shared/types/enums/mechanics/mechanics";

import type SetCellContract from "@shared/types/contracts/mechanics/SetCellContract";


export default createPlayerActionPacket<SetCellContract>(Mechanics.SETCELL, {
    index: ShortCodec, // Might fk up for 16*16 as bytes are signed, so take short
    value: ByteCodec
});
