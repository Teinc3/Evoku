import createPacket from "../factory/createPacket";
import IntCodec from "../../codecs/primitive/IntCodec";
import Networking from "../../../types/enums/actions/networking";


export const Ping = createPacket(Networking.PING, {
  serverTime: IntCodec,
  clientPing: IntCodec
});

export const Pong = createPacket(Networking.PONG, {
  clientTime: IntCodec,
  serverTime: IntCodec
});