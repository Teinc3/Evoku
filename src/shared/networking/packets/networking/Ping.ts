import IntCodec from "@shared/networking/codecs/primitive/IntCodec";
import createPacket from "@shared/networking/factory/createPacket";
import Networking from "@shared/types/enums/networking";

import type PingContract from "@shared/types/contracts/networking/PingContract";


export default createPacket<PingContract>(Networking.PING, {
    clientTime: IntCodec,
    serverTime: IntCodec
});
