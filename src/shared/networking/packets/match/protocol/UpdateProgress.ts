import createPacket from "../../factory/createPacket";
import { IntCodec, BoolCodec } from "../../../codecs/primitive";
import ProtocolActions from "../../../../types/enums/actions/match/protocol";


export default createPacket(ProtocolActions.UPDATE_PROGRESS, {
  playerID: IntCodec,
  isBoard: BoolCodec,
  progress: IntCodec,
});
