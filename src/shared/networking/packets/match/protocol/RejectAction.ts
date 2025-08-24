import createActionPacket from "../../factory/createActionPacket";
import { IntCodec } from "../../../codecs/primitive";
import ProtocolActions from "../../../../types/enums/actions/match/protocol";


export default createActionPacket(
  ProtocolActions.REJECT_ACTION,
  ['actionID'],
  {
    gameStateHash: IntCodec,
  }
);