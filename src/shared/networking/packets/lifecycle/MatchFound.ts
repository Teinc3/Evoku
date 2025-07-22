import createPacket from "../factory/createPacket";
import { ByteCodec } from "../../codecs/primitive";
import createArrayCodec from "../../codecs/factory/createArrayCodec";
import PlayerInfoCodec from "../../codecs/custom/PlayerInfoCodec";
import Lifecycle from "../../../types/enums/actions/lifecycle";


export default createPacket(Lifecycle.MATCH_FOUND, {
  myID: ByteCodec,
  players: createArrayCodec(PlayerInfoCodec)
})