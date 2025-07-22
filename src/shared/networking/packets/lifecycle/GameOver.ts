import createPacket from "../factory/createPacket";
import { ByteCodec } from "../../codecs/primitive";
import Lifecycle from "../../../types/enums/actions/lifecycle";


export default createPacket(Lifecycle.GAME_OVER, {
  winnerID: ByteCodec,
  reason: ByteCodec
})