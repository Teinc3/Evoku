import { ByteCodec } from "../../codecs/primitive";
import { createArrayCodec } from "../../factory/createArrayCodec";
import createPacket from "../../factory/createPacket";
import Lifecycle from "../../../types/enums/lifecycle";


export default createPacket(Lifecycle.GAME_INIT, {
    cellValues: createArrayCodec(ByteCodec)
})