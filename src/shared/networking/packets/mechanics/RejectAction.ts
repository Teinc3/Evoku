import createActionPacket from "../factory/createActionPacket";
import { IntCodec } from "../../codecs/primitive";
import Gameplay from "../../../types/enums/actions/mechanics/gameplay";


export default createActionPacket(
  Gameplay.REJECT_ACTION,
  ['actionID'],
  {
    boardHash: IntCodec
  }
);