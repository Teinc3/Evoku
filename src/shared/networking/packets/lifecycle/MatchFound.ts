import createPacket from "../factory/createPacket";
import { ByteCodec } from "../../codecs/primitive";
import createArrayCodec from "../../codecs/factory/createArrayCodec";
import PlayerInfoCodec from "../../codecs/custom/PlayerInfoCodec";
import LifecycleActions from "../../../types/enums/actions/match/lifecycle";


export default createPacket(LifecycleActions.MATCH_FOUND, {
  myID: ByteCodec,
  players: createArrayCodec(PlayerInfoCodec)
})