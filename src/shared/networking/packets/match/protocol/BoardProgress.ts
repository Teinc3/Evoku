import createPacket from "../../factory/createPacket";
import IntCodec from "../../../codecs/primitive/IntCodec";
import ProtocolActions from "../../../../types/enums/actions/match/protocol";


export default createPacket(ProtocolActions.BOARD_PROGRESS, {
  playerID: IntCodec,
  boardProgress: IntCodec,
});
