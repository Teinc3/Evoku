import { ByteCodec, ShortCodec } from "@shared/networking/codecs/primitive";
import createActionPackets from "@shared/networking/factory/createActionPackets";
import ExcavateBaseContract from "@shared/types/contracts/mechanics/powerups/earth/ExcavateContract";
import EarthPUP from "@shared/types/enums/mechanics/powerups/earth";


export default createActionPackets<ExcavateBaseContract>(EarthPUP.USE_EXCAVATE, {
    pupID: ByteCodec,
    targetID: ByteCodec,
    cellIndex: ShortCodec,
})