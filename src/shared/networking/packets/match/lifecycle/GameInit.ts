import createPacket from "../../factory/createPacket";
import { ByteCodec } from "../../../codecs/primitive";
import createArrayCodec from "../../../codecs/factory/createArrayCodec";
import LifecycleActions from "../../../../types/enums/actions/match/lifecycle";


export default createPacket(LifecycleActions.GAME_INIT, {
  cellValues: createArrayCodec(ByteCodec)
})