import createPacket from "../../factory/createPacket";
import IntCodec from "../../../codecs/primitive/IntCodec";
import ProtocolActions from "../../../../types/enums/actions/match/protocol";


export const Ping = createPacket(ProtocolActions.PING, {
  serverTime: IntCodec,
  clientPing: IntCodec,
});

export const Pong = createPacket(ProtocolActions.PONG, {
  clientTime: IntCodec,
  serverTime: IntCodec
});
