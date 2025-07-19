import createPacket from "../../factory/createPacket";
import Lifecycle from "../../../types/enums/actions/lifecycle";
import PlayerInfoCodec from "../../codecs/custom/PlayerInfoCodec";
import { ByteCodec } from "../../codecs/primitive";
import { createArrayCodec } from "../../factory/createArrayCodec";


export default createPacket(Lifecycle.MATCH_FOUND, {
    myID: ByteCodec,
    players: createArrayCodec(PlayerInfoCodec)
})