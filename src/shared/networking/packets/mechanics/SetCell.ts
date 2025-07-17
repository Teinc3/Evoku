import { ByteCodec, ShortCodec } from "../../codecs/primitive";
import createActionPacket from "../../factory/createActionPacket";
import Gameplay from "../../../types/enums/mechanics/gameplay";


export const SetCell = createActionPacket(Gameplay.SET_CELL, {
    cellIndex: ShortCodec,
    value: ByteCodec
});

export const CellSet = createActionPacket(Gameplay.CELL_SET, {
    cellIndex: ShortCodec,
    value: ByteCodec
});