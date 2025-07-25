import createPacket from "../factory/createPacket";
import { ByteCodec } from "../../codecs/primitive";
import LifecycleActions from "../../../types/enums/actions/match/lifecycle";


export default createPacket(LifecycleActions.GAME_OVER, {
  winnerID: ByteCodec,
  reason: ByteCodec
})