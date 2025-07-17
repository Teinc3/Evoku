import { ByteCodec, ShortCodec } from "../../../codecs/primitive";
import createActionPacket from "../../../factory/createActionPacket";
import EarthPUP from "../../../../types/enums/mechanics/powerups/earth";


export const UseExcavate = createActionPacket(EarthPUP.USE_EXCAVATE, {
    pupID: ByteCodec,
    targetID: ByteCodec,
    cellIndex: ShortCodec,
})

export const ExcavateUsed = createActionPacket(EarthPUP.EXCAVATE_USED, {
    pupID: ByteCodec,
    targetID: ByteCodec,
    cellIndex: ShortCodec,
});