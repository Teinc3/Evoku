import createPacket from "../factory/createPacket";
import { ByteCodec } from "../../codecs/primitive";
import createArrayCodec from "../../codecs/factory/createArrayCodec";
import Lifecycle from "../../../types/enums/actions/lifecycle";


export default createPacket(Lifecycle.GAME_INIT, {
  cellValues: createArrayCodec(ByteCodec)
})