import IntCodec from "@shared/networking/codecs/primitive/IntCodec";
import createPacket from "@shared/networking/factory/createPacket";
import Networking from "@shared/types/enums/networking";


export default createPacket(Networking.PING, {
    clientTime: IntCodec,
    serverTime: IntCodec
});
