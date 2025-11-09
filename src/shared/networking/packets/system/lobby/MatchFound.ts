import createPacket from "../../factory/createPacket";
import { ByteCodec } from "../../../codecs/primitive";
import createArrayCodec from "../../../codecs/factory/createArrayCodec";
import PlayerInfoCodec from "../../../codecs/custom/PlayerInfoCodec";
import LobbyActions from "../../../../types/enums/actions/system/lobby";


export default createPacket(LobbyActions.MATCH_FOUND, {
  myID: ByteCodec,
  players: createArrayCodec(PlayerInfoCodec)
})
