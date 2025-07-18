import createPacket from "../../factory/createPacket";
import Networking from "../../../types/enums/networking";
import IntCodec from "../../codecs/primitive/IntCodec";


export const Ping = createPacket(Networking.PING, {
    serverTime: IntCodec,
    clientPing: IntCodec
});

export const Pong = createPacket(Networking.PONG, {
    clientTime: IntCodec,
    serverTime: IntCodec
});