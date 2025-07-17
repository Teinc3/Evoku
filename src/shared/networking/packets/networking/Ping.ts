import IntCodec from "../../codecs/primitive/IntCodec";
import createPacket from "../../factory/createPacket";
import Networking from "../../../types/enums/networking";


export default createPacket(Networking.PING, {
    clientTime: IntCodec,
    serverTime: IntCodec
});
