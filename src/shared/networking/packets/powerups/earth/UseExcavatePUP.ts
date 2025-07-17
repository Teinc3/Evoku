import { ByteCodec, ShortCodec } from "../../../codecs/primitive";
import createActionPackets from "../../../factory/createActionPackets";
import ExcavateBaseContract from "../../../../types/contracts/mechanics/powerups/earth/ExcavateContract";
import EarthPUP from "../../../../types/enums/mechanics/powerups/earth";


export default createActionPackets<ExcavateBaseContract>(EarthPUP.USE_EXCAVATE, {
    pupID: ByteCodec,
    targetID: ByteCodec,
    cellIndex: ShortCodec,
})