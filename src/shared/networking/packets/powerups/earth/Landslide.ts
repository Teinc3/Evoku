import { ByteCodec, ShortCodec } from "../../../codecs/primitive";
import createActionPacket from "../../../factory/createActionPacket";
import EarthPUP from "../../../../types/enums/mechanics/powerups/earth";


export const UseLandslide = createActionPacket(EarthPUP.USE_LANDSLIDE, {
    pupID: ByteCodec,
    targetID: ByteCodec,
});

export const LandslideUsed = createActionPacket(EarthPUP.LANDSLIDE_USED, {
    pupID: ByteCodec,
    targetID: ByteCodec,
    cellIndex: ShortCodec,
});