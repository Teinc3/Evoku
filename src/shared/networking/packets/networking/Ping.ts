import IntCodec from "@shared/networking/codecs/primitive/IntCodec";
import createPacket from "@shared/networking/factory/createPacket";
import { Networking } from "@shared/types/contracts/ActionType";

import type PingContract from "@shared/types/contracts/networking/PingContract";


export default createPacket<PingContract>(Networking.PING, {
  timestamp: IntCodec
});
