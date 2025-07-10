import IntCodec from "@shared/networking/codecs/primitive/IntCodec";
import ByteCodec from "@shared/networking/codecs/primitive/ByteCodec";
import ShortCodec from "@shared/networking/codecs/primitive/ShortCodec";
import createPacket from "@shared/networking/factory/createPacket";
import { Mechanics } from "@shared/types/contracts/ActionType";

import type SetCellContract from "@shared/types/contracts/mechanics/SetCellContract";


export default createPacket<SetCellContract>(Mechanics.SETCELL, {
    time: IntCodec,
    playerID: ByteCodec,
    index: ShortCodec, // Might fk up for 16*16 as bytes are signed, so take short
    value: ByteCodec
});
