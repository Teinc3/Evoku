import createPacket from "../../factory/createPacket";
import Networking from "../../../types/enums/networking";
import IntCodec from "../../codecs/primitive/IntCodec";


export default createPacket(Networking.PONG, {
    serverTime: IntCodec,
    clientPing: IntCodec
});
