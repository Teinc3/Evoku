import { ByteCodec, ShortCodec } from "../../codecs/primitive";
import createActionPackets from "../../factory/createActionPackets";
import Gameplay from "../../../types/enums/mechanics/gameplay";
import type SetCellBaseContract from "../../../types/contracts/mechanics/SetCellContract";


export default createActionPackets<SetCellBaseContract>(Gameplay.SET_CELL, {
    index: ShortCodec, // Might fk up for 16*16 as bytes are signed, so take short
    value: ByteCodec
});