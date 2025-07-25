import createActionPacket from "../factory/createActionPacket";
import { IntCodec } from "../../codecs/primitive";
import MechanicsActions from "../../../types/enums/actions/match/player/mechanics";


export default createActionPacket(
  MechanicsActions.REJECT_ACTION,
  ['actionID'],
  {
    boardHash: IntCodec
  }
);