import createPacket from "@shared/networking/factory/createPacket";
import Networking from "@shared/types/enums/networking";
import IntCodec from "@shared/networking/codecs/primitive/IntCodec";


export default createPacket(Networking.PONG, {
    serverTime: IntCodec,
    clientPing: IntCodec
});
