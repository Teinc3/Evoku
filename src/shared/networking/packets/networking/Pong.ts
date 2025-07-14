import IntCodec from "@shared/networking/codecs/primitive/IntCodec";
import createPacket from "@shared/networking/factory/createPacket";
import Networking from "@shared/types/enums/networking";

import type PongContract from "@shared/types/contracts/networking/PongContract";


export default createPacket<PongContract>(Networking.PONG, {
    serverTime: IntCodec,
    clientPing: IntCodec
});
