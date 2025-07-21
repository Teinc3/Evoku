import createPacket from "../factory/createPacket";
import Lifecycle from "../../../types/enums/actions/lifecycle";
import { ByteCodec } from "../../codecs/primitive";


export default createPacket(Lifecycle.GAME_OVER, {
    winnerID: ByteCodec,
    reason: ByteCodec
})